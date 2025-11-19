#!/bin/bash
# CloudFormation Deployment Script for Use Case 8: Rollback

set -euo pipefail

PROJECT_NAME="${1:-myapp}"
ENVIRONMENT="${2:-dev}"
CLUSTER_NAME="${3:-}"
SERVICE_NAME="${4:-}"
PREVIOUS_REVISION="${5:-}"

if [ -z "$CLUSTER_NAME" ] || [ -z "$SERVICE_NAME" ] || [ -z "$PREVIOUS_REVISION" ]; then
  echo "Usage: $0 <project> <env> <cluster-name> <service-name> <previous-task-def-revision>"
  exit 1
fi

AWS_REGION="${AWS_REGION:-us-east-1}"

log_info() { echo -e "\033[0;32m[INFO]\033[0m $1"; }

log_info "Rolling back ${SERVICE_NAME} in ${CLUSTER_NAME} to ${PREVIOUS_REVISION}"

# Direct rollback via AWS CLI (simpler than CloudFormation for this use case)
aws ecs update-service \
  --cluster "${CLUSTER_NAME}" \
  --service "${SERVICE_NAME}" \
  --task-definition "${PREVIOUS_REVISION}" \
  --region "${AWS_REGION}"

log_info "Rollback initiated. Monitoring deployment..."

aws ecs wait services-stable \
  --cluster "${CLUSTER_NAME}" \
  --services "${SERVICE_NAME}" \
  --region "${AWS_REGION}"

log_info "Rollback completed successfully"

