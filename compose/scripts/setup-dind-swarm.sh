#!/usr/bin/env bash
set -e

CONTAINER_NAME="dind-swarm-test"
CONTEXT_NAME="dind-swarm"
PORT="2375"

echo "=== Cleaning up old environments ==="
docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
docker context rm "$CONTEXT_NAME" 2>/dev/null || true

echo "=== Starting Docker-in-Docker ==="
# Run DinD with TLS disabled for local testing
docker run --privileged --name "$CONTAINER_NAME" -d \
  -v /tmp:/tmp \
  -e DOCKER_TLS_CERTDIR="" \
  -p "$PORT:2375" \
  docker:dind

echo "=== Waiting for Dockerd to start inside DinD ==="
sleep 5
# Wait until docker info succeeds
until docker exec "$CONTAINER_NAME" docker info >/dev/null 2>&1; do
    echo "Waiting..."
    sleep 2
done

echo "=== Initializing Swarm ==="
docker exec "$CONTAINER_NAME" docker swarm init

echo "=== Creating External Networks in Swarm ==="
docker exec "$CONTAINER_NAME" docker network create -d overlay vnet-frontend || true
docker exec "$CONTAINER_NAME" docker network create -d overlay vnet-backend || true

echo "=== Setting up Docker Context ==="
docker context create "$CONTEXT_NAME" --docker "host=tcp://127.0.0.1:$PORT"
echo "✅ Context '$CONTEXT_NAME' created."

echo ""
echo "You can now test swarm deployments via:"
echo "  docker -c $CONTEXT_NAME stack deploy -c compose.yaml mystack"
echo ""
echo "To tear down:"
echo "  docker rm -f $CONTAINER_NAME && docker context rm $CONTEXT_NAME"
