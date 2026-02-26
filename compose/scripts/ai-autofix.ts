#!/usr/bin/env -S deno run --allow-net --allow-read --allow-env --allow-write
/**
 * ai-autofix.ts
 * 
 * Takes failure logs, parses them to identify failing services, reads their 
 * compose templates, and prompts Gemini 3.1 Pro to suggest a fix.
 * It applies the fix to the file system so a PR can be created.
 */

import { join } from "jsr:@std/path";

const apiKey = Deno.env.get("GEMINI_API_KEY");
const logsPath = Deno.args[0];

if (!apiKey) {
  console.error("No GEMINI_API_KEY provided.");
  Deno.exit(1);
}

if (!logsPath) {
  console.error("Usage: ai-autofix.ts <logs-path>");
  Deno.exit(1);
}

async function run() {
  const logs = await Deno.readTextFile(logsPath);
  
  // Extract failing services from logs (e.g. "❌ [consul] Compose up failed!")
  const failedServices = new Set<string>();
  const matches = logs.matchAll(/❌ \[(.*?)\] (Compose up failed!|Swarm service never reached healthy replicas!)/g);
  for (const match of matches) {
    failedServices.add(match[1]);
  }

  if (failedServices.size === 0) {
    console.log("No explicit service failures found in logs. Generating generic analysis...");
    // Fallback logic could go here.
    Deno.exit(0);
  }

  for (const service of failedServices) {
    console.log(`Analyzing failure for service: ${service}`);
    const tmplPath = join("compose", service, "default", "compose.yaml.tmpl");
    let template = "";
    try {
      template = await Deno.readTextFile(tmplPath);
    } catch {
      console.log(`Could not read ${tmplPath}, skipping.`);
      continue;
    }

    const prompt = `
You are an expert DevOps engineer fixing Docker Compose configurations.
The following service "${service}" failed its healthcheck or swarm deployment.

Logs:
\`\`\`
${logs.substring(Math.max(0, logs.length - 10000))}
\`\`\`

Here is the current compose.yaml.tmpl:
\`\`\`yaml
${template}
\`\`\`

Identify why it failed. Output ONLY the fully corrected compose.yaml.tmpl file contents, with no markdown formatting backticks around it (just the raw text).
Do not include any explanations.
`;

    console.log(`Prompting Gemini 3.1 Pro for ${service}...`);
    
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!res.ok) {
      console.error(`Gemini API error: ${res.status} ${await res.text()}`);
      continue;
    }

    const data = await res.json();
    let fix = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (fix) {
      // Clean up markdown block if Gemini included it despite instructions
      fix = fix.replace(/^```yaml\n/, "").replace(/^```\n/, "").replace(/```$/, "");
      await Deno.writeTextFile(tmplPath, fix.trim() + "\n");
      console.log(`✅ Applied fix to ${tmplPath}`);
    } else {
      console.log(`❌ No fix generated for ${service}`);
    }
  }
}

run();
