#!/bin/bash
# Multi-Container Deployment Script

set -euo pipefail

PROJECT_NAME="${1:-myapp}"
ENVIRONMENT="${2:-dev}"
CLUSTER_NAME="${3:-}"
SERVICE_NAME="${4:-}"
TASK_DEF_FILE="${5:-task-definition.json}"

if [ -z "$CLUSTER_NAME" ] || [ -z "$SERVICE_NAME" ] || [ ! -f "$TASK_DEF_FILE" ]; then
  echo "Usage: $0 <project> <env> <cluster> <service> <task-definition.json>"
  exit 1
fi

AWS_REGION="${AWS_REGION:-us-east-1}"

log_info() { echo -e "\033[0;32m[INFO]\033[0m $1"; }

log_info "Registering multi-container task definition..."

TASK_DEF_ARN=$(aws ecs register-task-definition \
  --cli-input-json file://"${TASK_DEF_FILE}" \
  --region "${AWS_REGION}" \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)

log_info "Task definition registered: ${TASK_DEF_ARN}"

log_info "Updating service with multi-container task definition..."

aws ecs update-service \
  --cluster "${CLUSTER_NAME}" \
  --service "${SERVICE_NAME}" \
  --task-definition "${TASK_DEF_ARN}" \
  --deployment-circuit-breaker "enable=true,rollback=true" \
  --region "${AWS_REGION}"

log_info "Multi-container deployment initiated"

