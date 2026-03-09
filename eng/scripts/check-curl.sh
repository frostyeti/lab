#!/bin/bash
FILES=$(grep -r "test: .*CMD.*curl" compose/*/default/compose.yaml.tmpl | awk -F':' '{print $1}')
for f in $FILES; do
  IMAGE=$(grep "image: " "$f" | grep -o ':-[^}]*' | sed 's/:-//g' | head -n 1)
  TAG=$(grep "image: " "$f" | grep -o ':-[^}]*$' | sed 's/:-//g' | head -n 1)
  if [ -z "$TAG" ]; then TAG="latest"; fi
  if [[ "$IMAGE" == *":"* ]]; then
    FULL_IMAGE="$IMAGE"
  else
    FULL_IMAGE="${IMAGE}:${TAG}"
  fi
  echo "Checking $FULL_IMAGE in $f..."
  docker run --rm --entrypoint sh "$FULL_IMAGE" -c "which curl" >/dev/null 2>&1
  if [ $? -ne 0 ]; then
    echo "NO CURL IN $FULL_IMAGE"
    # Fallback to wget
    docker run --rm --entrypoint sh "$FULL_IMAGE" -c "which wget" >/dev/null 2>&1
    if [ $? -eq 0 ]; then
      echo "BUT WGET EXISTS in $FULL_IMAGE, replacing..."
      sed -i 's/curl", "-f"/wget", "-q", "-O", "-"/g' "$f"
    else
      echo "NEITHER CURL NOR WGET in $FULL_IMAGE, removing healthcheck..."
      sed -i '/healthcheck:/,+4d' "$f"
    fi
  else
    echo "CURL EXISTS in $FULL_IMAGE"
  fi
done
