ui = true

listener "tcp" {
  address       = "0.0.0.0:8200"
  tls_disable   = 1
}

storage "file" {
  path = "/vault/data"
}

api_addr     = "http://0.0.0.0:8200"
cluster_addr = "http://0.0.0.0:8201"

# Disable mlock — required when running in a container without CAP_IPC_LOCK
# or when the kernel doesn't support it. The compose file adds IPC_LOCK cap
# so this can be set to false in production if desired.
disable_mlock = true

# Telemetry — exposes /v1/sys/metrics for Prometheus scraping
telemetry {
  prometheus_retention_time = "30s"
  disable_hostname          = true
}

log_level = "info"
