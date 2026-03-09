#!/bin/bash
APPS="cadvisor chrony cloudbeaver defectdojo docker-crontab dockhand duin elasticsearch external-dns"

for app in $APPS; do
  echo "Testing $app..."
  deno run -A compose/scripts/test.ts --service $app > "test-$app.log" 2>&1
  if [ $? -ne 0 ]; then
    echo "❌ $app FAILED"
  else
    echo "✅ $app PASSED"
  fi
done
