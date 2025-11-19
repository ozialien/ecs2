#!/bin/bash
# Emergency Hotfix Deployment Script

set -euo pipefail

PROJECT_NAME="${1:-myapp}"
ENVIRONMENT="${2:-dev}"
CLUSTER_NAME="${3:-}"
SERVICE_NAME="${4:-}"
HOTFIX_IMAGE_URI="${5:-}"
HOTFIX_TAG="${6:-hotfix-$(date +%Y%m%d)}"

if [ -z "$CLUSTER_NAME" ] || [ -z "$SERVICE_NAME" ] || [ -z "$HOTFIX_IMAGE_URI" ]; then
  echo "Usage: $0 <project> <env> <cluster> <service> <hotfix-image-uri> [hotfix-tag]"
  exit 1
fi

AWS_REGION="${AWS_REGION:-us-east-1}"

log_info() { echo -e "\033[0;32m[INFO]\033[0m $1"; }
log_warn() { echo -e "\033[1;33m[WARN]\033[0m $1"; }

log_warn "EMERGENCY HOTFIX DEPLOYMENT - Bypassing normal CI/CD process"

# Get current task definition
CURRENT_TASK_DEF=$(aws ecs describe-services \
  --cluster "${CLUSTER_NAME}" \
  --services "${SERVICE_NAME}" \
  --region "${AWS_REGION}" \
  --query 'services[0].taskDefinition' \
  --output text)

log_info "Current task definition: ${CURRENT_TASK_DEF}"

# Get task definition JSON
aws ecs describe-task-definition \
  --task-definition "${CURRENT_TASK_DEF}" \
  --region "${AWS_REGION}" \
  --query 'taskDefinition' > /tmp/task-def.json

# Update image in task definition
jq ".containerDefinitions[0].image = \"${HOTFIX_IMAGE_URI}:${HOTFIX_TAG}\"" /tmp/task-def.json > /tmp/task-def-hotfix.json

# Remove fields that can't be in register-task-definition
jq 'del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)' /tmp/task-def-hotfix.json > /tmp/task-def-final.json

# Register new task definition
HOTFIX_TASK_DEF=$(aws ecs register-task-definition \
  --cli-input-json file:///tmp/task-def-final.json \
  --region "${AWS_REGION}" \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)

log_info "Hotfix task definition registered: ${HOTFIX_TASK_DEF}"

# Force new deployment
aws ecs update-service \
  --cluster "${CLUSTER_NAME}" \
  --service "${SERVICE_NAME}" \
  --task-definition "${HOTFIX_TASK_DEF}" \
  --force-new-deployment \
  --region "${AWS_REGION}"

log_info "Emergency hotfix deployment initiated"
log_warn "Remember to merge hotfix to main branch and redeploy via CI/CD"

