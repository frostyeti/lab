#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write
/**
 * update-version.ts
 *
 * Fetches the latest stable release tag for a compose service's Docker image,
 * then updates:
 *   1. The ${TAG:-<version>} default in compose/<service>/default/compose.yaml
 *   2. The "## Latest Version" section in compose/<service>/README.md
 *
 * Usage:
 *   deno run --allow-net --allow-read --allow-write compose/scripts/update-version.ts <service>
 *   deno run --allow-net --allow-read --allow-write compose/scripts/update-version.ts --all
 *
 * The script reads SERVICE_REGISTRY below to know where each service's image
 * comes from (Docker Hub or GitHub releases).
 */

// ---------------------------------------------------------------------------
// Service registry
// Maps service directory name → { image, source }
// source:
//   { type: "dockerhub", repo: "library/postgres" }
//   { type: "github",    repo: "owner/repo" }  — uses GitHub releases API
//   { type: "ghcr",      repo: "owner/repo", package: "owner/repo/image" }
// ---------------------------------------------------------------------------
interface DockerHubSource {
  type: "dockerhub";
  repo: string; // e.g. "library/postgres" or "traefik/traefik"
  /** Tag filter regex — only tags matching this pattern are considered stable */
  filter?: string;
}
interface GithubSource {
  type: "github";
  repo: string; // e.g. "grafana/loki"
  /** Strip this prefix from the tag name to get the version string */
  tagPrefix?: string;
}
interface GhcrSource {
  type: "ghcr";
  /** GitHub repo that publishes releases */
  repo: string;
  tagPrefix?: string;
}

type ImageSource = DockerHubSource | GithubSource | GhcrSource;

interface ServiceEntry {
  source: ImageSource;
  /** Suffix appended to version for the image tag e.g. "-alpine" */
  tagSuffix?: string;
}

const SERVICE_REGISTRY: Record<string, ServiceEntry> = {
  traefik: {
    source: { type: "dockerhub", repo: "library/traefik", filter: "^v?\\d+\\.\\d+\\.\\d+$" },
  },
  caddy: {
    source: { type: "dockerhub", repo: "library/caddy", filter: "^\\d+\\.\\d+\\.\\d+-alpine$" },
  },
  coredns: {
    source: { type: "dockerhub", repo: "coredns/coredns", filter: "^\\d+\\.\\d+\\.\\d+$" },
  },
  dashy: {
    source: { type: "ghcr", repo: "lissy93/dashy" },
  },
  postgres: {
    source: { type: "dockerhub", repo: "library/postgres", filter: "^\\d+\\.\\d+-alpine$" },
  },
  redis: {
    source: { type: "dockerhub", repo: "library/redis", filter: "^\\d+\\.\\d+-alpine$" },
  },
  mssql: {
    source: { type: "dockerhub", repo: "microsoft/mssql-server", filter: "^\\d{4}-latest$" },
  },
  mysql: {
    source: { type: "dockerhub", repo: "library/mysql", filter: "^\\d+\\.\\d+$" },
  },
  rabbitmq: {
    source: {
      type: "dockerhub",
      repo: "library/rabbitmq",
      filter: "^\\d+\\.\\d+-management-alpine$",
    },
  },
  vault: {
    source: { type: "dockerhub", repo: "hashicorp/vault", filter: "^\\d+\\.\\d+\\.\\d+$" },
  },
  consul: {
    source: { type: "dockerhub", repo: "hashicorp/consul", filter: "^\\d+\\.\\d+\\.\\d+$" },
  },
  etcd: {
    source: { type: "ghcr", repo: "etcd-io/etcd", tagPrefix: "v" },
  },
  vaultwarden: {
    source: { type: "dockerhub", repo: "vaultwarden/server", filter: "^\\d+\\.\\d+\\.\\d+$" },
  },
  "code-server": {
    source: { type: "ghcr", repo: "linuxserver/docker-code-server", tagPrefix: "v" },
  },
  gitea: {
    source: { type: "dockerhub", repo: "gitea/gitea", filter: "^\\d+\\.\\d+\\.\\d+$" },
  },
  wireguard: {
    source: { type: "ghcr", repo: "wg-easy/wg-easy" },
  },
  defguard: {
    source: { type: "ghcr", repo: "defguard/defguard", tagPrefix: "v" },
  },
  headscale: {
    source: { type: "ghcr", repo: "juanfont/headscale", tagPrefix: "v" },
  },
  pangolin: {
    source: { type: "ghcr", repo: "fosrl/pangolin", tagPrefix: "v" },
  },
  rustfs: {
    source: { type: "dockerhub", repo: "rustfs/rustfs", filter: "^\\d+\\.\\d+\\.\\d+$" },
  },
  rustdesk: {
    source: { type: "dockerhub", repo: "rustdesk/rustdesk-server", filter: "^\\d+\\.\\d+\\.\\d+$" },
  },
  filerun: {
    source: { type: "dockerhub", repo: "filerun/filerun", filter: "^\\d{8}$" },
  },
  n8n: {
    source: { type: "dockerhub", repo: "n8nio/n8n", filter: "^\\d+\\.\\d+\\.\\d+$" },
  },
  windmill: {
    source: { type: "dockerhub", repo: "windmilldev/windmill", filter: "^\\d+\\.\\d+\\.\\d+$" },
  },
  temporal: {
    source: { type: "dockerhub", repo: "temporalio/server", filter: "^\\d+\\.\\d+\\.\\d+$" },
  },
  kestra: {
    source: { type: "dockerhub", repo: "kestra/kestra", filter: "^v\\d+\\.\\d+\\.\\d+$" },
  },
  prometheus: {
    source: { type: "dockerhub", repo: "prom/prometheus", filter: "^v\\d+\\.\\d+\\.\\d+$" },
  },
  loki: {
    source: { type: "github", repo: "grafana/loki", tagPrefix: "v" },
  },
  grafana: {
    source: { type: "dockerhub", repo: "grafana/grafana", filter: "^\\d+\\.\\d+\\.\\d+$" },
  },
  "grafana-oncall": {
    source: { type: "dockerhub", repo: "grafana/oncall", filter: "^v\\d+\\.\\d+\\.\\d+$" },
  },
  posthog: {
    source: { type: "dockerhub", repo: "posthog/posthog", filter: "^release-\\d+\\.\\d+\\.\\d+$" },
  },
};

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

async function fetchDockerHubLatest(repo: string, filter?: string): Promise<string | null> {
  // Docker Hub tags API (v2)
  const [namespace, name] = repo.includes("/") ? repo.split("/", 2) : ["library", repo];
  const url =
    `https://hub.docker.com/v2/repositories/${namespace}/${name}/tags?page_size=100&ordering=last_updated`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Docker Hub fetch failed for ${repo}: ${res.status}`);
    return null;
  }
  const data = await res.json();
  const tags: string[] = (data.results ?? []).map((t: { name: string }) => t.name);
  const re = filter ? new RegExp(filter) : null;
  const stable = tags.filter((t) => {
    if (re && !re.test(t)) return false;
    // Exclude rc/alpha/beta/dev tags unless the filter already handles it
    if (!re && /rc|alpha|beta|dev|latest/i.test(t)) return false;
    return true;
  });
  return stable[0] ?? null;
}

async function fetchGithubLatest(repo: string, tagPrefix = ""): Promise<string | null> {
  const url = `https://api.github.com/repos/${repo}/releases/latest`;
  const res = await fetch(url, {
    headers: { "User-Agent": "homelab-update-version/1.0" },
  });
  if (!res.ok) {
    console.error(`GitHub fetch failed for ${repo}: ${res.status}`);
    return null;
  }
  const data = await res.json();
  const tag: string = data.tag_name ?? "";
  return tag.startsWith(tagPrefix) ? tag.slice(tagPrefix.length) : tag;
}

async function fetchGhcrLatest(repo: string, tagPrefix = ""): Promise<string | null> {
  // GHCR doesn't have a public tags API without auth; fall back to GitHub releases
  return fetchGithubLatest(repo, tagPrefix);
}

async function fetchLatest(entry: ServiceEntry): Promise<string | null> {
  const { source } = entry;
  switch (source.type) {
    case "dockerhub":
      return fetchDockerHubLatest(source.repo, source.filter);
    case "github":
      return fetchGithubLatest(source.repo, source.tagPrefix ?? "");
    case "ghcr":
      return fetchGhcrLatest(source.repo, source.tagPrefix ?? "");
  }
}

// ---------------------------------------------------------------------------
// Updaters
// ---------------------------------------------------------------------------

const COMPOSE_DIR = new URL("../../", import.meta.url).pathname.replace(/\/$/, "");

async function updateComposeYaml(service: string, newTag: string): Promise<boolean> {
  const path = `${COMPOSE_DIR}/${service}/default/compose.yaml`;
  let content: string;
  try {
    content = await Deno.readTextFile(path);
  } catch {
    console.warn(`  compose.yaml not found: ${path}`);
    return false;
  }

  // Match patterns like:
  //   image: postgres:${TAG:-16.3-alpine}
  //   image: traefik:${TAG:-v2.11.0}
  //   image: some/image:${TAG:-1.2.3}
  const re = /(\bimage:\s*\S+:\$\{TAG:-)[^\}]+(\})/g;
  const updated = content.replace(re, `$1${newTag}$2`);
  if (updated === content) {
    // Tag line may not yet use ${TAG:-...} — skip silently
    console.warn(`  No \${TAG:-...} placeholder found in ${path} — skipping compose.yaml update`);
    return false;
  }
  await Deno.writeTextFile(path, updated);
  return true;
}

async function updateReadme(service: string, newTag: string): Promise<boolean> {
  const path = `${COMPOSE_DIR}/${service}/README.md`;
  let content: string;
  try {
    content = await Deno.readTextFile(path);
  } catch {
    console.warn(`  README.md not found: ${path}`);
    return false;
  }

  // Replace the line after "## Latest Version" heading
  const re = /(##\s+Latest Version\s*\n+)[^\n]+/;
  const updated = content.replace(re, `$1\`${newTag}\``);
  if (updated === content) {
    console.warn(`  No "## Latest Version" section found in ${path} — skipping README update`);
    return false;
  }
  await Deno.writeTextFile(path, updated);
  return true;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function processService(service: string): Promise<void> {
  const entry = SERVICE_REGISTRY[service];
  if (!entry) {
    console.error(`Unknown service: "${service}". Check SERVICE_REGISTRY in this script.`);
    return;
  }

  console.log(`\n[${service}] Fetching latest version...`);
  const version = await fetchLatest(entry);
  if (!version) {
    console.error(`  Could not determine latest version for ${service}`);
    return;
  }

  const tag = entry.tagSuffix ? `${version}${entry.tagSuffix}` : version;
  console.log(`  Latest tag: ${tag}`);

  const composeUpdated = await updateComposeYaml(service, tag);
  const readmeUpdated = await updateReadme(service, tag);

  if (composeUpdated) console.log(`  Updated compose.yaml`);
  if (readmeUpdated) console.log(`  Updated README.md`);
  if (!composeUpdated && !readmeUpdated) console.log(`  Nothing to update`);
}

const args = Deno.args;
if (args.length === 0) {
  console.error("Usage: update-version.ts <service> | --all");
  Deno.exit(1);
}

if (args[0] === "--all") {
  for (const service of Object.keys(SERVICE_REGISTRY)) {
    await processService(service);
  }
} else {
  for (const service of args) {
    await processService(service);
  }
}

console.log("\nDone.");
