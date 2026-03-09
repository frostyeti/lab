import { ensureDir } from "https://deno.land/std@0.224.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";

const apps = [
  "arcane",
  "dockhand",
  "portainer",
  "watchtower",
  "tugtainer",
  "duin",
  "cup",
  "renovate"
];

for (const app of apps) {
  const baseDir = join("compose", app);
  const defaultDir = join(baseDir, "default");
  const prodDir = join(baseDir, "prod");
  const testDir = join(baseDir, "test");

  await ensureDir(defaultDir);
  await ensureDir(prodDir);
  await ensureDir(testDir);

  const castfile = `imports:
  - docker

env:
  MNT_DIR: "\${MNT_DIR:-../../.mnt}"
  SERVICE_NAME: "${app}"

inventories:
  - ./prod-inventory.yaml
  - ./test-inventory.yaml

tasks:
  up:before:
    desc: "Scaffold ${app} config dir into .mnt"
    uses: bash
    run: |
      mkdir -p \${MNT_DIR}/data/${app}
      mkdir -p \${MNT_DIR}/config/${app}
`;
  await Deno.writeTextFile(join(baseDir, "castfile"), castfile);

  const envFile = `TAG=latest\n`;
  await Deno.writeTextFile(join(defaultDir, ".env"), envFile);
  await Deno.writeTextFile(join(prodDir, ".env"), envFile);
  await Deno.writeTextFile(join(testDir, ".env"), envFile);

  const composeYaml = `services:
  ${app}:
    env_file:
      - .env
`;
  await Deno.writeTextFile(join(defaultDir, "compose.yaml"), composeYaml);

  let composeTmpl = `services:
  ${app}:
    image: \${IMAGE_NAME:-${app}}:\${TAG:-latest}
    container_name: ${app}
    {{- if ne .env.DEPLOY_MODE "swarm" }}
    restart: unless-stopped
    {{- end }}
    environment:
      - TZ=UTC
    volumes:
      - \${MNT_DIR}/data/${app}:/data
      - \${MNT_DIR}/config/${app}:/config
    networks:
      - vnet-frontend
      - vnet-backend
    {{- if eq .env.DEPLOY_MODE "swarm" }}
    deploy:
      mode: replicated
      replicas: {{ default "1" .data.replicas }}
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    {{- end }}

networks:
  vnet-frontend:
    external: true
  vnet-backend:
    external: true
`;
  await Deno.writeTextFile(join(defaultDir, "compose.yaml.tmpl"), composeTmpl);

  const inventoryYaml = `vars:
  replicas: 1
`;
  await Deno.writeTextFile(join(baseDir, "prod-inventory.yaml"), inventoryYaml);
  await Deno.writeTextFile(join(baseDir, "test-inventory.yaml"), inventoryYaml);

  const readmeStr = `# ${app}\n\nAutomated deployment for ${app}.\n`;
  await Deno.writeTextFile(join(baseDir, "README.md"), readmeStr);

  console.log(`Scaffolded ${app}`);
}
