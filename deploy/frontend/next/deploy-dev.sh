#!/usr/bin/env bash
################################################################################
# TrainWithGouli - Frontend Dev Deployment Script
#
# Builds the Next.js frontend image and prints the Ansible command that would
# deploy it to the dev server.
#
# Usage:
#   ./deploy/frontend/next/deploy-dev.sh
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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../" && pwd)"
ANSIBLE_DIR="${REPO_ROOT}/infra/ansible"
BUILD_SCRIPT="${REPO_ROOT}/scripts/frontend/next/build-docker.sh"

# Extract version from version.js
VERSION_FILE="${REPO_ROOT}/version.js"
if [[ ! -f "$VERSION_FILE" ]]; then
    log_error "version.js not found at ${VERSION_FILE}"
    exit 1
fi

VERSION=$(node -e "const v=require('${VERSION_FILE}'); console.log(v.VERSION)")
if [[ -z "$VERSION" ]]; then
    log_error "Could not extract VERSION from ${VERSION_FILE}"
    exit 1
fi

log_info "Deploying TrainWithGouli frontend to DEV"
log_info "Version: ${VERSION}"

# Build the image
log_info "Building frontend image..."
"${BUILD_SCRIPT}" --push

log_info "Frontend image built and pushed ✓"

# Print the Ansible command that would be run
log_info "Run the following Ansible command to complete the deployment:"
echo ""
echo -e "${BLUE}cd ${ANSIBLE_DIR} && \\
ansible-playbook -i inventory/dev.yml playbooks/deploy.yml \\
    -e \"deploy_version=${VERSION}\" \\
    --vault-password-file ~/.ansible/vault-password-trainwithgouli${NC}"
echo ""

log_info "Dev deployment prepared ✓"
log_info "URL: https://server01.taild68ded.ts.net"
