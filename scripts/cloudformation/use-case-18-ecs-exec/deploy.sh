#!/bin/bash
# ECS Exec Enablement Script

set -euo pipefail

PROJECT_NAME="${1:-myapp}"
ENVIRONMENT="${2:-dev}"
CLUSTER_NAME="${3:-}"
SERVICE_NAME="${4:-}"
ENABLE="${5:-true}"

if [ -z "$CLUSTER_NAME" ] || [ -z "$SERVICE_NAME" ]; then
  echo "Usage: $0 <project> <env> <cluster> <service> [enable=true/false]"
  exit 1
fi

AWS_REGION="${AWS_REGION:-us-east-1}"

log_info() { echo -e "\033[0;32m[INFO]\033[0m $1"; }

if [ "$ENABLE" = "true" ]; then
  log_info "Enabling ECS Exec on ${SERVICE_NAME}"
  aws ecs update-service \
    --cluster "${CLUSTER_NAME}" \
    --service "${SERVICE_NAME}" \
    --enable-execute-command \
    --region "${AWS_REGION}"
else
  log_info "Disabling ECS Exec on ${SERVICE_NAME}"
  aws ecs update-service \
    --cluster "${CLUSTER_NAME}" \
    --service "${SERVICE_NAME}" \
    --no-enable-execute-command \
    --region "${AWS_REGION}"
fi

log_info "ECS Exec ${ENABLE} completed"
log_info "To connect: aws ecs execute-command --cluster ${CLUSTER_NAME} --task <task-id> --container <container-name> --interactive"

