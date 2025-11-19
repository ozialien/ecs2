#!/bin/bash
# Config Change Script

set -euo pipefail

PROJECT_NAME="${1:-myapp}"
ENVIRONMENT="${2:-dev}"
CLUSTER_NAME="${3:-}"
SERVICE_NAME="${4:-}"
NEW_DESIRED_COUNT="${5:-}"
NEW_CPU="${6:-}"
NEW_MEMORY="${7:-}"

if [ -z "$CLUSTER_NAME" ] || [ -z "$SERVICE_NAME" ]; then
  echo "Usage: $0 <project> <env> <cluster> <service> [desired-count] [cpu] [memory]"
  exit 1
fi

AWS_REGION="${AWS_REGION:-us-east-1}"

log_info() { echo -e "\033[0;32m[INFO]\033[0m $1"; }

# Get current task definition
CURRENT_TASK_DEF=$(aws ecs describe-services \
  --cluster "${CLUSTER_NAME}" \
  --services "${SERVICE_NAME}" \
  --region "${AWS_REGION}" \
  --query 'services[0].taskDefinition' \
  --output text)

log_info "Current task definition: ${CURRENT_TASK_DEF}"

# Update task definition if CPU/memory changed
if [ -n "$NEW_CPU" ] || [ -n "$NEW_MEMORY" ]; then
  aws ecs describe-task-definition \
    --task-definition "${CURRENT_TASK_DEF}" \
    --region "${AWS_REGION}" \
    --query 'taskDefinition' > /tmp/task-def.json

  if [ -n "$NEW_CPU" ]; then
    jq ".cpu = \"${NEW_CPU}\"" /tmp/task-def.json > /tmp/task-def-updated.json
    mv /tmp/task-def-updated.json /tmp/task-def.json
  fi

  if [ -n "$NEW_MEMORY" ]; then
    jq ".memory = \"${NEW_MEMORY}\"" /tmp/task-def.json > /tmp/task-def-updated.json
    mv /tmp/task-def-updated.json /tmp/task-def.json
  fi

  jq 'del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)' /tmp/task-def.json > /tmp/task-def-final.json

  NEW_TASK_DEF=$(aws ecs register-task-definition \
    --cli-input-json file:///tmp/task-def-final.json \
    --region "${AWS_REGION}" \
    --query 'taskDefinition.taskDefinitionArn' \
    --output text)

  log_info "New task definition registered: ${NEW_TASK_DEF}"
  CURRENT_TASK_DEF="${NEW_TASK_DEF}"
fi

# Update service
UPDATE_CMD="aws ecs update-service --cluster ${CLUSTER_NAME} --service ${SERVICE_NAME} --task-definition ${CURRENT_TASK_DEF} --region ${AWS_REGION}"

if [ -n "$NEW_DESIRED_COUNT" ]; then
  UPDATE_CMD="${UPDATE_CMD} --desired-count ${NEW_DESIRED_COUNT}"
fi

eval "${UPDATE_CMD}"

log_info "Configuration update completed"

