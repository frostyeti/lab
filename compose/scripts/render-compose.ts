#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env
/**
 * render-compose.ts
 *
 * Renders a compose.yaml.tmpl file using environment variables and an optional
 * YAML values file. Supports a Go-template-inspired syntax:
 *
 *   {{ if eq .env.DEPLOY_MODE "swarm" }}...{{ end }}
 *   {{ if ne .env.DEPLOY_MODE "swarm" }}...{{ end }}
 *   {{ .env.MY_VAR }}
 *   {{ .data.replicas }}
 *   {{ default "1" .data.replicas }}
 *
 * Usage:
 *   deno run --allow-read --allow-write --allow-env render-compose.ts <template> [output] [values.yaml]
 *
 * If output is omitted, strips .tmpl/.tpl extension from template path.
 * If values.yaml is omitted, looks for values.yaml next to the template file.
 */

import { parse as parseYaml } from "jsr:@std/yaml";
import { dirname, join, extname, basename } from "jsr:@std/path";

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = Deno.args;
if (args.length === 0) {
  console.error("Usage: render-compose.ts <template> [output] [values.yaml]");
  Deno.exit(1);
}

const templatePath = args[0];
const templateDir = dirname(templatePath);
const templateExt = extname(templatePath);

let outputPath = args[1];
if (!outputPath) {
  if (templateExt === ".tmpl" || templateExt === ".tpl" || templateExt === ".gotmpl") {
    outputPath = templatePath.slice(0, -templateExt.length);
  } else {
    outputPath = templatePath + ".out";
  }
}

// Look for values.yaml next to the template if not provided
const defaultValues = join(templateDir, "values.yaml");
let valuesPath = args[2];
if (!valuesPath) {
  try {
    await Deno.stat(defaultValues);
    valuesPath = defaultValues;
  } catch {
    valuesPath = "";
  }
}

// ── Load data ─────────────────────────────────────────────────────────────────

const envMap: Record<string, string> = {};
for (const [k, v] of Object.entries(Deno.env.toObject())) {
  envMap[k] = v ?? "";
}

let dataMap: Record<string, unknown> = {};
if (valuesPath) {
  try {
    const raw = await Deno.readTextFile(valuesPath);
    dataMap = (parseYaml(raw) as Record<string, unknown>) ?? {};
  } catch (e) {
    console.error(`Warning: could not load values file ${valuesPath}: ${e}`);
  }
}

const ctx = { env: envMap, data: dataMap };

// ── Template engine ───────────────────────────────────────────────────────────

/**
 * Resolve a dotted path like ".env.DEPLOY_MODE" or ".data.replicas" against ctx.
 */
function resolvePath(path: string): unknown {
  // Strip leading dot
  const parts = path.replace(/^\./, "").split(".");
  let cur: unknown = ctx;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

/**
 * Evaluate a simple condition expression:
 *   eq .env.FOO "bar"
 *   ne .env.FOO "bar"
 *   .env.FOO   (truthy check)
 */
function evalCondition(expr: string): boolean {
  expr = expr.trim();
  const eqMatch = expr.match(/^eq\s+(\S+)\s+"([^"]*)"$/);
  if (eqMatch) return String(resolvePath(eqMatch[1]) ?? "") === eqMatch[2];

  const neMatch = expr.match(/^ne\s+(\S+)\s+"([^"]*)"$/);
  if (neMatch) return String(resolvePath(neMatch[1]) ?? "") !== neMatch[2];

  // Bare path — truthy check
  const val = resolvePath(expr);
  return Boolean(val);
}

/**
 * Evaluate a value expression:
 *   .env.FOO
 *   .data.bar
 *   default "fallback" .data.bar
 */
function evalValue(expr: string): string {
  expr = expr.trim();
  const defaultMatch = expr.match(/^default\s+"([^"]*)"\s+(\S+)$/);
  if (defaultMatch) {
    const val = resolvePath(defaultMatch[2]);
    return val != null && val !== "" ? String(val) : defaultMatch[1];
  }
  // Check for string literal (basic support for double quotes, allowing escaped quotes)
  const stringMatch = expr.match(/^"(.*)"$/);
  if (stringMatch) {
    return stringMatch[1].replace(/\\"/g, '"');
  }
  return String(resolvePath(expr) ?? "");
}

/**
 * Render the template string.
 *
 * Handles:
 *   {{ if <cond> }}...{{ else }}...{{ end }}
 *   {{ if <cond> }}...{{ end }}
 *   {{ <value-expr> }}
 *
 * Block tags that end with `-}}` trim the trailing newline after the tag.
 * Block tags that start with `{{-` trim the leading whitespace before the tag.
 */
function render(template: string): string {
  const result: string[] = [];
  // Stack for nested if blocks: each entry is { active: bool, done: bool }
  const stack: Array<{ active: boolean; done: boolean }> = [];

  // Tokenise into literal text and {{ ... }} blocks
  const tokenRe = /(\{\{-?\s*[\s\S]*?-?\}\})/g;
  let lastIndex = 0;

  function isActive(): boolean {
    return stack.every((s) => s.active);
  }

  let match: RegExpExecArray | null;
  while ((match = tokenRe.exec(template)) !== null) {
    const before = template.slice(lastIndex, match.index);
    lastIndex = match.index + match[0].length;

    const tag = match[0];
    const trimLeft = tag.startsWith("{{-");
    const trimRight = tag.endsWith("-}}");

    // Extract inner expression, strip whitespace
    const inner = tag
      .replace(/^\{\{-?\s*/, "")
      .replace(/\s*-?\}\}$/, "")
      .trim();

    // Push literal text before this tag (possibly trimmed)
    if (isActive()) {
      result.push(trimLeft ? before.trimEnd() : before);
    }

    if (inner.startsWith("if ")) {
      const cond = inner.slice(3).trim();
      const active = evalCondition(cond);
      stack.push({ active, done: active });
      if (trimRight && isActive() && result.length > 0) {
        // trim newline after opening if tag
        const last = result[result.length - 1];
        result[result.length - 1] = last.replace(/\n$/, "");
      }
    } else if (inner === "else") {
      if (stack.length > 0) {
        const top = stack[stack.length - 1];
        top.active = !top.done;
      }
    } else if (inner === "end") {
      stack.pop();
      if (trimRight && result.length > 0) {
        const last = result[result.length - 1];
        result[result.length - 1] = last.replace(/\n$/, "");
      }
    } else {
      // Value expression
      if (isActive()) {
        result.push(evalValue(inner));
      }
    }
  }

  // Remaining text after last tag
  if (isActive()) {
    result.push(template.slice(lastIndex));
  }

  return result.join("");
}

// ── Run ───────────────────────────────────────────────────────────────────────

const templateContent = await Deno.readTextFile(templatePath);
const rendered = render(templateContent);
await Deno.writeTextFile(outputPath, rendered);

console.log(`Rendered: ${templatePath} → ${outputPath}`);
