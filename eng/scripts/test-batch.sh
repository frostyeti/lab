#!/bin/bash
NEW_APPS="anythingllm arcane authentik bind9 cadvisor chrony cloudbeaver cup defectdojo docker-crontab dockhand duin elasticsearch external-dns fleetdm gatus gitlab gotify graphite greenbone-openvas home-assistant immich influxdb kali-linux keycloak librechat meilisearch nessus nextcloud node-red ofelia open-claw open-webui owasp-zap pastebins peekaping portainer renovate rss-reader secure-file-share secure-secret-share sftpgo signoz tinyauth tugtainer uptime-kuma vigil watchtower wazuh wikijs zipkin"

FAILURES=""
for app in $NEW_APPS; do
  echo "Testing $app..."
  deno run -A compose/scripts/test.ts --service $app > "test-$app.log" 2>&1
  if [ $? -ne 0 ]; then
    echo "$app FAILED"
    FAILURES="$FAILURES $app"
  else
    echo "$app PASSED"
  fi
done

echo "Failures: $FAILURES"
