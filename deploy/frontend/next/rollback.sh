#!/usr/bin/env bash
################################################################################
# TrainWithGouli - Frontend Rollback Script
#
# Rolls the frontend container back to a previous image tag.
#
# Usage:
#   ./deploy/frontend/next/rollback.sh [version]
#
# If no version is provided, rolls back to the latest tag.
################################################################################

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../" && pwd)"

VERSION="${1:-latest}"
REMOTE_IMAGE="docker.io/muzammilmomin/trainwithgouli:frontend-${VERSION}"

echo ""
echo -e "${YELLOW}⚠️  ROLLBACK${NC}"
echo ""
read -p "Roll back frontend to ${REMOTE_IMAGE}? (yes/no): " confirm
if [[ "$confirm" != "yes" ]]; then
    log_info "Rollback cancelled"
    exit 0
fi

log_info "Rolling back frontend to ${REMOTE_IMAGE}..."

# Print the Ansible command that would perform the rollback
ANSIBLE_DIR="${REPO_ROOT}/infra/ansible"
echo ""
echo -e "${BLUE}Run the following command on the target server:${NC}"
echo ""
echo -e "${BLUE}podman pull ${REMOTE_IMAGE} && \\
cd /opt/trainwithgouli && \\
podman-compose down && \\
podman-compose up -d${NC}"
echo ""

log_info "Rollback prepared ✓"
