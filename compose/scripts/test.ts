#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-run --allow-net
/**
 * Test Runner for Homelab Compose/Swarm services
 */

import { join } from "jsr:@std/path";
import { ensureDir } from "jsr:@std/fs";

const COMPOSE_DIR = join(Deno.cwd(), "compose");
const MAX_CONCURRENT = parseInt(Deno.env.get("MAX_CONCURRENT_TESTS") || "1", 10);
const SWARM_CONTEXT = "dind-swarm";

async function getServices(): Promise<string[]> {
  const services: string[] = [];
  for await (const entry of Deno.readDir(COMPOSE_DIR)) {
    if (entry.isDirectory && !["scripts", "setup", ".cast"].includes(entry.name) && !entry.name.startsWith(".")) {
      try {
        await Deno.stat(join(COMPOSE_DIR, entry.name, "castfile"));
        services.push(entry.name);
      } catch {
        // no castfile, skip
      }
    }
  }
  return services.sort();
}

async function runCmd(cmd: string[], cwd: string, env: Record<string, string> = {}): Promise<{ code: number, stdout: string, stderr: string }> {
  const process = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    cwd,
    env,
    stdout: "piped",
    stderr: "piped",
  });
  const output = await process.output();
  return {
    code: output.code,
    stdout: new TextDecoder().decode(output.stdout),
    stderr: new TextDecoder().decode(output.stderr),
  };
}

async function createTempNetworks() {
  console.log("=== Creating default Docker networks ===");
  await runCmd(["docker", "network", "create", "vnet-frontend"], Deno.cwd());
  await runCmd(["docker", "network", "create", "vnet-backend"], Deno.cwd());
}

async function testService(service: string): Promise<boolean> {
  console.log(`\n=== Testing [${service}] ===`);
  const svcDir = join(COMPOSE_DIR, service);
  
  // 1. Generate files
  console.log(`[${service}] Generating compose files...`);
  // Load .env if it exists
  let envConfig: Record<string, string> = {};
  try {
    const dotenv = await Deno.readTextFile(join(svcDir, "default", ".env"));
    dotenv.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) envConfig[match[1]] = match[2].replace(/^["']|["']$/g, '');
    });
  } catch {}

  const renderEnv = { ...Deno.env.toObject(), ...envConfig, DEPLOY_MODE: "compose" };
  await runCmd(["deno", "run", "-A", "../scripts/render-compose.ts", "default/compose.yaml.tmpl", "default/compose.yaml"], svcDir, renderEnv);

  const renderEnvSwarm = { ...renderEnv, DEPLOY_MODE: "swarm" };
  await runCmd(["deno", "run", "-A", "../scripts/render-compose.ts", "default/compose.yaml.tmpl", "prod/compose.yaml"], svcDir, renderEnvSwarm);

  // Get full list of services to strip ports
  const configRes = await runCmd(["docker", "compose", "-f", "default/compose.yaml", "config", "--format", "json"], svcDir);
  let overridePath = "";
  if (configRes.code === 0) {
     try {
       const parsed = JSON.parse(configRes.stdout);
       const overrideObj: any = { services: {} };
       if (parsed.services) {
         for (const sName of Object.keys(parsed.services)) {
           overrideObj.services[sName] = { ports: "!reset []" };
         }
         // Write docker-compose.override.yml
         overridePath = join(svcDir, "docker-compose.override.yml");
         let yamlStr = "services:\n";
         for (const sName of Object.keys(parsed.services)) {
            yamlStr += `  ${sName}:\n    ports: !reset []\n`;
         }
         await Deno.writeTextFile(overridePath, yamlStr);
       }
     } catch (e) {
       console.log(`[${service}] Failed to parse compose config JSON, skipping port override`);
     }
  }

  // Set up temp mount dir
  const mntDir = await Deno.makeTempDir({ prefix: `homelab-test-${service}-` });
  const dataDir = join(mntDir, "data", service);
  const etcDir = join(mntDir, "etc", service);
  const logDir = join(mntDir, "log", service);
  
  await ensureDir(dataDir);
  await ensureDir(etcDir);
  await ensureDir(logDir);

  // Auto-scaffold from default/etc and default/data if they exist
  try {
    const defaultEtc = join(svcDir, "default", "etc");
    const stat = await Deno.stat(defaultEtc);
    if (stat.isDirectory) {
      await runCmd(["cp", "-a", defaultEtc + "/.", etcDir], svcDir);
    }
  } catch {}
  
  try {
    const defaultData = join(svcDir, "default", "data");
    const stat = await Deno.stat(defaultData);
    if (stat.isDirectory) {
      await runCmd(["cp", "-a", defaultData + "/.", dataDir], svcDir);
    }
  } catch {}

  const env = { 
    MNT_DIR: mntDir,
    PROXY_TYPE: "none"
  };

  try {
    // 2. Test Compose Mode
    console.log(`[${service}] Testing docker compose up --wait...`);
    
    const composeArgs = ["compose", "-f", "default/compose.yaml"];
    if (overridePath) {
      composeArgs.push("-f", "docker-compose.override.yml");
    }
    composeArgs.push("up", "-d", "--wait");

    const upRes = await runCmd(["docker", ...composeArgs], svcDir, env);
    if (upRes.code !== 0) {
      console.error(`❌ [${service}] Compose up failed!`);
      // Dump logs of all containers in this compose stack
      const logsArgs = ["compose", "-f", "default/compose.yaml"];
      if (overridePath) logsArgs.push("-f", "docker-compose.override.yml");
      logsArgs.push("logs");
      
      const logsRes = await runCmd(["docker", ...logsArgs], svcDir, env);
      console.error("Healthcheck failure logs:");
      console.error(logsRes.stdout);
      console.error(logsRes.stderr);
      return false;
    }
    
    console.log(`✅ [${service}] Compose healthcheck passed.`);

  } finally {
    console.log(`[${service}] Tearing down compose...`);
    const downArgs = ["compose", "-f", "default/compose.yaml"];
    if (overridePath) {
      downArgs.push("-f", "docker-compose.override.yml");
    }
    downArgs.push("down", "-v");
    await runCmd(["docker", ...downArgs], svcDir, env);
    if (overridePath) {
      await Deno.remove(overridePath).catch(() => {});
    }
  }

  // 3. Test Swarm Mode (if context available)
  try {
    const contextCheck = await runCmd(["docker", "-c", SWARM_CONTEXT, "info"], svcDir);
    if (contextCheck.code === 0) {
      console.log(`[${service}] Testing docker swarm deploy...`);
      const stackName = `test_${service}`;
      
      // create override for swarm too? actually stack deploy ignores override files unless specified
      // but stack deploy doesn't conflict ports usually on a separate single-node unless host port published
      // we'll let it be for now since dind swarm is isolated.

      const deployRes = await runCmd(["docker", "-c", SWARM_CONTEXT, "stack", "deploy", "-c", "prod/compose.yaml", stackName], svcDir, env);
      if (deployRes.code !== 0) {
        console.error(`❌ [${service}] Swarm deploy failed!`);
        console.error(deployRes.stderr);
        return false;
      }

      // Wait for 1/1 replicas
      let healthy = false;
      for (let i = 0; i < 30; i++) { // wait up to 60s
        await new Promise(r => setTimeout(r, 2000));
        const lsRes = await runCmd(["docker", "-c", SWARM_CONTEXT, "stack", "services", stackName], svcDir);
        // Look for 1/1 or 2/2 in output
        if (lsRes.stdout.includes("1/1") || lsRes.stdout.includes("2/2")) {
          healthy = true;
          break;
        }
      }

      if (!healthy) {
         console.error(`❌ [${service}] Swarm service never reached healthy replicas!`);
         return false;
      }
      console.log(`✅ [${service}] Swarm deployment healthy.`);

      console.log(`[${service}] Tearing down swarm...`);
      await runCmd(["docker", "-c", SWARM_CONTEXT, "stack", "rm", stackName], svcDir);
    }
  } catch (e) {
    console.log(`[${service}] Swarm context ${SWARM_CONTEXT} not available, skipping swarm test.`);
  }

  return true;
}

async function main() {
  if (!Deno.cwd().endsWith("lab")) {
    console.error("Please run this script from the repository root: deno run -A compose/scripts/test.ts");
    Deno.exit(1);
  }

  const args = Deno.args;
  let targetService = "";
  if (args.length >= 2 && args[0] === "--service") {
    targetService = args[1];
  }

  let services = await getServices();
  if (targetService) {
    if (!services.includes(targetService)) {
      console.error(`Service ${targetService} not found.`);
      Deno.exit(1);
    }
    services = [targetService];
  }

  console.log(`Found ${services.length} services to test.`);

  await createTempNetworks();

  const failed: string[] = [];

  for (const svc of services) {
    const success = await testService(svc);
    if (!success) {
      failed.push(svc);
    }
  }

  console.log("\n=== Test Run Complete ===");
  if (failed.length > 0) {
    console.error(`❌ Failed services: ${failed.join(", ")}`);
    Deno.exit(1);
  } else {
    console.log("✅ All services passed!");
    Deno.exit(0);
  }
}

main();
