#!/usr/bin/env bash
################################################################################
# TrainWithGouli - Top-Level Deployment Script
#
# Dispatches to component deploy scripts.
#
# Usage:
#   ./deploy/deploy.sh [frontend|backend|all] [dev|prod]
#
# Examples:
#   ./deploy/deploy.sh frontend dev
#   ./deploy/deploy.sh all prod
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

usage() {
    echo "Usage: $0 [frontend|backend|all] [dev|prod]"
    echo ""
    echo "Examples:"
    echo "  $0 frontend dev"
    echo "  $0 all prod"
}

COMPONENT="${1:-frontend}"
ENVIRONMENT="${2:-dev}"

case "$COMPONENT" in
    frontend|backend|all)
        ;;
    *)
        log_error "Invalid component: ${COMPONENT}"
        usage
        exit 1
        ;;
esac

case "$ENVIRONMENT" in
    dev|development)
        ENVIRONMENT="dev"
        ;;
    prod|production)
        ENVIRONMENT="prod"
        ;;
    *)
        log_error "Invalid environment: ${ENVIRONMENT}"
        usage
        exit 1
        ;;
esac

if [[ "$COMPONENT" == "backend" ]]; then
    log_warn "Backend deployment is not yet implemented."
    exit 0
fi

log_info "Deploying component: ${COMPONENT}, environment: ${ENVIRONMENT}"

if [[ "$COMPONENT" == "frontend" || "$COMPONENT" == "all" ]]; then
    DEPLOY_SCRIPT="${SCRIPT_DIR}/frontend/next/deploy-${ENVIRONMENT}.sh"
    if [[ ! -x "$DEPLOY_SCRIPT" ]]; then
        log_error "Deploy script not found or not executable: ${DEPLOY_SCRIPT}"
        exit 1
    fi
    log_info "Running ${DEPLOY_SCRIPT}..."
    "${DEPLOY_SCRIPT}"
fi

log_info "Deployment complete ✓"
