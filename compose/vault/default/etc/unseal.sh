#!/bin/sh
# vault-unseal.sh
# Runs as the vault-unseal sidecar container.
# Waits for Vault to be reachable, then submits unseal keys.
# Exits 0 when Vault is unsealed, non-zero on error (triggers restart: on-failure).
#
# Required env vars (injected by kpv at deploy time):
#   VAULT_ADDR         — e.g. http://vault:8200
#   VAULT_UNSEAL_KEY_1
#   VAULT_UNSEAL_KEY_2
#   VAULT_UNSEAL_KEY_3

set -e

VAULT_ADDR="${VAULT_ADDR:-http://vault:8200}"
MAX_RETRIES=30
RETRY_DELAY=5

log() {
  echo "[vault-unseal] $*"
}

# Wait until Vault HTTP is reachable
wait_for_vault() {
  local retries=0
  log "Waiting for Vault at ${VAULT_ADDR} ..."
  until wget -qO- "${VAULT_ADDR}/v1/sys/health" >/dev/null 2>&1; do
    retries=$((retries + 1))
    if [ "$retries" -ge "$MAX_RETRIES" ]; then
      log "ERROR: Vault did not become reachable after $((MAX_RETRIES * RETRY_DELAY))s"
      exit 1
    fi
    sleep "$RETRY_DELAY"
  done
  log "Vault is reachable."
}

# Check if Vault is already unsealed
is_unsealed() {
  sealed=$(wget -qO- "${VAULT_ADDR}/v1/sys/seal-status" 2>/dev/null | grep -o '"sealed":[^,}]*' | cut -d: -f2 | tr -d ' "')
  [ "$sealed" = "false" ]
}

# Check if Vault is initialized
is_initialized() {
  initialized=$(wget -qO- "${VAULT_ADDR}/v1/sys/init" 2>/dev/null | grep -o '"initialized":[^,}]*' | cut -d: -f2 | tr -d ' "')
  [ "$initialized" = "true" ]
}

unseal_with_key() {
  local key="$1"
  if [ -z "$key" ]; then
    return 0
  fi
  wget -qO- \
    --header "Content-Type: application/json" \
    --post-data "{\"key\":\"${key}\"}" \
    "${VAULT_ADDR}/v1/sys/unseal" >/dev/null 2>&1
}

wait_for_vault

if ! is_initialized; then
  log "Vault is not initialized. Initialize manually with:"
  log "  docker exec vault vault operator init"
  log "Then store the unseal keys in kpv and redeploy."
  exit 1
fi

if is_unsealed; then
  log "Vault is already unsealed. Nothing to do."
  exit 0
fi

log "Vault is sealed. Submitting unseal keys..."

unseal_with_key "${VAULT_UNSEAL_KEY_1}"
unseal_with_key "${VAULT_UNSEAL_KEY_2}"
unseal_with_key "${VAULT_UNSEAL_KEY_3}"

# Verify
if is_unsealed; then
  log "Vault successfully unsealed."
  exit 0
else
  log "ERROR: Vault is still sealed after submitting keys. Check that the correct keys are set."
  exit 1
fi
