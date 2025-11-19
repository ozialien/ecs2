#!/bin/bash
# Image Scan Script

set -euo pipefail

PROJECT_NAME="${1:-myapp}"
ENVIRONMENT="${2:-dev}"
ECR_REPO_NAME="${3:-}"
IMAGE_TAG="${4:-latest}"

if [ -z "$ECR_REPO_NAME" ]; then
  echo "Usage: $0 <project> <env> <ecr-repo-name> [image-tag]"
  exit 1
fi

AWS_REGION="${AWS_REGION:-us-east-1}"

log_info() { echo -e "\033[0;32m[INFO]\033[0m $1"; }

log_info "Starting image scan for ${ECR_REPO_NAME}:${IMAGE_TAG}"

aws ecr start-image-scan \
  --repository-name "${ECR_REPO_NAME}" \
  --image-id imageTag="${IMAGE_TAG}" \
  --region "${AWS_REGION}"

log_info "Scan initiated. Waiting for completion..."

while true; do
  STATUS=$(aws ecr describe-image-scan-findings \
    --repository-name "${ECR_REPO_NAME}" \
    --image-id imageTag="${IMAGE_TAG}" \
    --region "${AWS_REGION}" \
    --query 'imageScanStatus.status' \
    --output text)
  
  if [ "$STATUS" = "COMPLETE" ]; then
    break
  fi
  
  sleep 10
done

log_info "Scan completed. Retrieving findings..."

aws ecr describe-image-scan-findings \
  --repository-name "${ECR_REPO_NAME}" \
  --image-id imageTag="${IMAGE_TAG}" \
  --region "${AWS_REGION}" \
  --query 'imageScanFindings.findings[*].[severity,name]' \
  --output table

