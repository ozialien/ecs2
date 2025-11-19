#!/bin/bash
# Blue/Green Deployment Script

set -euo pipefail

PROJECT_NAME="${1:-myapp}"
ENVIRONMENT="${2:-dev}"
CLUSTER_NAME="${3:-}"
SERVICE_NAME="${4:-}"
TASK_DEF_ARN="${5:-}"
TARGET_GROUP_ARN="${6:-}"

if [ -z "$CLUSTER_NAME" ] || [ -z "$SERVICE_NAME" ] || [ -z "$TASK_DEF_ARN" ]; then
  echo "Usage: $0 <project> <env> <cluster> <service> <task-def-arn> [target-group-arn]"
  exit 1
fi

AWS_REGION="${AWS_REGION:-us-east-1}"
GREEN_SERVICE="${SERVICE_NAME}-green"

log_info() { echo -e "\033[0;32m[INFO]\033[0m $1"; }

log_info "Creating or updating green service: ${GREEN_SERVICE}"

# Check if green service exists (idempotent)
if aws ecs describe-services --cluster "${CLUSTER_NAME}" --services "${GREEN_SERVICE}" --region "${AWS_REGION}" --query 'services[0].status' --output text 2>/dev/null | grep -q "ACTIVE"; then
  log_info "Green service already exists, updating..."
  aws ecs update-service \
    --cluster "${CLUSTER_NAME}" \
    --service "${GREEN_SERVICE}" \
    --task-definition "${TASK_DEF_ARN}" \
    --region "${AWS_REGION}"
else
  log_info "Green service does not exist, creating..."
  # Create green service (simplified - full implementation would create new target group)
  aws ecs create-service \
    --cluster "${CLUSTER_NAME}" \
    --service-name "${GREEN_SERVICE}" \
    --task-definition "${TASK_DEF_ARN}" \
    --desired-count 2 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
    --region "${AWS_REGION}"
fi

log_info "Green service ready. Next steps:"
log_info "1. Update ALB listener to route traffic to green target group"
log_info "2. Monitor green service health"
log_info "3. Delete blue service after validation"

