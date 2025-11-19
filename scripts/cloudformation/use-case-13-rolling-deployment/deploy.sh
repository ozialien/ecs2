#!/bin/bash
# Rolling Deployment Script

set -euo pipefail

PROJECT_NAME="${1:-myapp}"
ENVIRONMENT="${2:-dev}"
CLUSTER_NAME="${3:-}"
SERVICE_NAME="${4:-}"
TASK_DEF_ARN="${5:-}"
MAX_PERCENT="${6:-200}"
MIN_HEALTHY_PERCENT="${7:-50}"

if [ -z "$CLUSTER_NAME" ] || [ -z "$SERVICE_NAME" ] || [ -z "$TASK_DEF_ARN" ]; then
  echo "Usage: $0 <project> <env> <cluster> <service> <task-def-arn> [max-percent] [min-healthy-percent]"
  exit 1
fi

AWS_REGION="${AWS_REGION:-us-east-1}"

log_info() { echo -e "\033[0;32m[INFO]\033[0m $1"; }

log_info "Starting rolling deployment for ${SERVICE_NAME}"

aws ecs update-service \
  --cluster "${CLUSTER_NAME}" \
  --service "${SERVICE_NAME}" \
  --task-definition "${TASK_DEF_ARN}" \
  --deployment-configuration "maximumPercent=${MAX_PERCENT},minimumHealthyPercent=${MIN_HEALTHY_PERCENT}" \
  --deployment-circuit-breaker "enable=true,rollback=true" \
  --region "${AWS_REGION}"

log_info "Rolling deployment initiated. Monitoring..."

aws ecs wait services-stable \
  --cluster "${CLUSTER_NAME}" \
  --services "${SERVICE_NAME}" \
  --region "${AWS_REGION}"

log_info "Rolling deployment completed successfully"

