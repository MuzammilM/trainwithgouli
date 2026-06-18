#!/usr/bin/env bash
################################################################################
# TrainWithGouli - Next.js Frontend Image Build Script
#
# Builds the Next.js frontend image once, tagged for local use and Docker Hub.
# Works with either Docker or Podman.
#
# Usage:
#   ./scripts/frontend/next/build-docker.sh [--push]
#
# Tags created:
#   - trainwithgouli-frontend:${VERSION}
#   - trainwithgouli-frontend:latest
#   - docker.io/muzammilmomin/trainwithgouli:frontend-v${VERSION}
#   - docker.io/muzammilmomin/trainwithgouli:frontend-latest
################################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
VERSION_FILE="${ROOT_DIR}/version.js"
DOCKERFILE_DIR="${ROOT_DIR}/frontend/next"
IMAGE_NAME="trainwithgouli-frontend"
REMOTE_IMAGE_NAME="docker.io/muzammilmomin/trainwithgouli"
PUSH_IMAGE=false

usage() {
    echo "Usage: $0 [--push]"
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --push)
            PUSH_IMAGE=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}Error: Unknown argument '$1'${NC}"
            usage
            exit 1
            ;;
    esac
done

detect_engine() {
    if [[ -n "${CONTAINER_ENGINE:-}" ]]; then
        echo "${CONTAINER_ENGINE}"
        return 0
    fi

    if command -v docker >/dev/null 2>&1; then
        echo "docker"
        return 0
    fi

    if command -v podman >/dev/null 2>&1; then
        echo "podman"
        return 0
    fi

    return 1
}

push_image() {
    local engine="$1"
    local image="$2"

    case "$engine" in
        docker)
            docker push "$image"
            ;;
        podman)
            podman push "$image"
            ;;
        *)
            echo -e "${RED}Error: Unsupported engine '$engine'${NC}"
            exit 1
            ;;
    esac
}

# Extract current version
if [ ! -f "$VERSION_FILE" ]; then
    echo -e "${RED}Error: $VERSION_FILE not found${NC}"
    exit 1
fi

CURRENT_VERSION=$(node -e "const v=require('${VERSION_FILE}'); console.log(v.VERSION)")

if [ -z "$CURRENT_VERSION" ]; then
    echo -e "${RED}Error: Could not extract VERSION from $VERSION_FILE${NC}"
    exit 1
fi

ENGINE="$(detect_engine)" || true
if [ -z "$ENGINE" ]; then
    echo -e "${RED}Error: Neither docker nor podman was found${NC}"
    exit 1
fi

LOCAL_TAG="${IMAGE_NAME}:${CURRENT_VERSION}"
LOCAL_LATEST="${IMAGE_NAME}:latest"
REMOTE_TAG="${REMOTE_IMAGE_NAME}:frontend-v${CURRENT_VERSION}"
REMOTE_LATEST="${REMOTE_IMAGE_NAME}:frontend-latest"

# Build args defaults (replace with real values in CI or via env)
NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://your-project.supabase.co}"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-your-publishable-key}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  TrainWithGouli Next.js Docker Build${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Version:  ${CURRENT_VERSION}${NC}"
echo -e "${YELLOW}Context:  ${DOCKERFILE_DIR}/${NC}"
echo -e "${YELLOW}Engine:   ${ENGINE}${NC}"
echo ""

# Determine platform - default to linux/amd64 for cross-platform compatibility
PLATFORM="${DOCKER_DEFAULT_PLATFORM:-linux/amd64}"

echo -e "${BLUE}Building image with ${ENGINE} (platform: ${PLATFORM})...${NC}"
"${ENGINE}" build \
    --platform "${PLATFORM}" \
    --build-arg NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}" \
    --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}" \
    -t "${LOCAL_TAG}" \
    -t "${LOCAL_LATEST}" \
    -t "${REMOTE_TAG}" \
    -t "${REMOTE_LATEST}" \
    "${DOCKERFILE_DIR}"

echo ""
echo -e "${GREEN}✓ Build successful${NC}"
echo -e "${GREEN}  Tagged: ${LOCAL_TAG}${NC}"
echo -e "${GREEN}  Tagged: ${LOCAL_LATEST}${NC}"
echo -e "${GREEN}  Tagged: ${REMOTE_TAG}${NC}"
echo -e "${GREEN}  Tagged: ${REMOTE_LATEST}${NC}"

if [[ "$PUSH_IMAGE" == true ]]; then
    echo ""
    echo -e "${BLUE}Pushing ${REMOTE_TAG}...${NC}"
    push_image "$ENGINE" "$REMOTE_TAG"
    echo -e "${BLUE}Pushing ${REMOTE_LATEST}...${NC}"
    push_image "$ENGINE" "$REMOTE_LATEST"
    echo -e "${GREEN}✓ Push successful${NC}"
fi

echo ""
echo -e "${BLUE}To run locally:${NC}"
echo -e "  docker compose -f deploy/docker-compose.yml up -d"
echo ""
echo -e "${BLUE}To push to Docker Hub:${NC}"
echo -e "  ./scripts/frontend/next/build-docker.sh --push"
