#!/bin/bash
# Auto-Scaling Configuration Script

set -euo pipefail

PROJECT_NAME="${1:-myapp}"
ENVIRONMENT="${2:-dev}"
CLUSTER_NAME="${3:-}"
SERVICE_NAME="${4:-}"
MIN_CAPACITY="${5:-1}"
MAX_CAPACITY="${6:-10}"
TARGET_CPU="${7:-70}"

if [ -z "$CLUSTER_NAME" ] || [ -z "$SERVICE_NAME" ]; then
  echo "Usage: $0 <project> <env> <cluster> <service> [min-capacity] [max-capacity] [target-cpu]"
  exit 1
fi

AWS_REGION="${AWS_REGION:-us-east-1}"
RESOURCE_ID="service/${CLUSTER_NAME}/${SERVICE_NAME}"

log_info() { echo -e "\033[0;32m[INFO]\033[0m $1"; }

log_info "Registering scalable target..."

aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id "${RESOURCE_ID}" \
  --min-capacity "${MIN_CAPACITY}" \
  --max-capacity "${MAX_CAPACITY}" \
  --region "${AWS_REGION}"

log_info "Creating CPU scaling policy..."

aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id "${RESOURCE_ID}" \
  --policy-name "${PROJECT_NAME}-cpu-scaling-${ENVIRONMENT}" \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration "{
    \"TargetValue\": ${TARGET_CPU}.0,
    \"PredefinedMetricSpecification\": {
      \"PredefinedMetricType\": \"ECSServiceAverageCPUUtilization\"
    },
    \"ScaleInCooldown\": 300,
    \"ScaleOutCooldown\": 60
  }" \
  --region "${AWS_REGION}"

log_info "Auto-scaling configured successfully"

