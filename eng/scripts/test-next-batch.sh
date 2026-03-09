#!/bin/bash
APPS="home-assistant immich influxdb kali-linux keycloak"

for app in $APPS; do
  echo "Testing $app..."
  deno run -A compose/scripts/test.ts --service $app
  if [ $? -ne 0 ]; then
    echo "❌ $app FAILED"
    exit 1
  else
    echo "✅ $app PASSED"
  fi
done
