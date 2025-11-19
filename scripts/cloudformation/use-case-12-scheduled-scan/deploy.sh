#!/bin/bash
# Scheduled Scan Script

set -euo pipefail

PROJECT_NAME="${1:-myapp}"
ENVIRONMENT="${2:-dev}"
ECR_REPO_NAME="${3:-}"
SCHEDULE="${4:-cron(0 2 * * ? *)}"

if [ -z "$ECR_REPO_NAME" ]; then
  echo "Usage: $0 <project> <env> <ecr-repo-name> [schedule]"
  exit 1
fi

AWS_REGION="${AWS_REGION:-us-east-1}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

log_info() { echo -e "\033[0;32m[INFO]\033[0m $1"; }

log_info "Creating EventBridge rule for scheduled image scan..."

# Create EventBridge rule
RULE_ARN=$(aws events put-rule \
  --name "${PROJECT_NAME}-scheduled-scan-${ENVIRONMENT}" \
  --schedule-expression "${SCHEDULE}" \
  --description "Scheduled image scan for ${ECR_REPO_NAME}" \
  --region "${AWS_REGION}" \
  --query 'RuleArn' \
  --output text)

log_info "EventBridge rule created: ${RULE_ARN}"

# Create Lambda function for scanning (simplified - would need full Lambda deployment)
log_info "Note: Lambda function for scanning should be created separately"
log_info "Then add as target: aws events put-targets --rule ${PROJECT_NAME}-scheduled-scan-${ENVIRONMENT} --targets ..."

