#!/bin/bash
# Batch Job Scheduling Script

set -euo pipefail

PROJECT_NAME="${1:-myapp}"
ENVIRONMENT="${2:-dev}"
CLUSTER_NAME="${3:-}"
TASK_DEF_ARN="${4:-}"
SCHEDULE="${5:-cron(0 2 * * ? *)}"
JOB_NAME="${6:-${PROJECT_NAME}-batch-job-${ENVIRONMENT}}"

if [ -z "$CLUSTER_NAME" ] || [ -z "$TASK_DEF_ARN" ]; then
  echo "Usage: $0 <project> <env> <cluster> <task-def-arn> [schedule] [job-name]"
  exit 1
fi

AWS_REGION="${AWS_REGION:-us-east-1}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

log_info() { echo -e "\033[0;32m[INFO]\033[0m $1"; }

log_info "Creating EventBridge rule for batch job: ${JOB_NAME}"

# Create EventBridge rule
RULE_ARN=$(aws events put-rule \
  --name "${JOB_NAME}-schedule" \
  --schedule-expression "${SCHEDULE}" \
  --description "Scheduled ECS task for ${JOB_NAME}" \
  --region "${AWS_REGION}" \
  --query 'RuleArn' \
  --output text)

log_info "EventBridge rule created: ${RULE_ARN}"

# Create IAM role for EventBridge
ROLE_ARN=$(aws iam create-role \
  --role-name "${PROJECT_NAME}-eventbridge-role-${ENVIRONMENT}" \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "events.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }' \
  --query 'Role.Arn' \
  --output text 2>/dev/null || \
  aws iam get-role --role-name "${PROJECT_NAME}-eventbridge-role-${ENVIRONMENT}" --query 'Role.Arn' --output text)

# Attach policy
aws iam put-role-policy \
  --role-name "${PROJECT_NAME}-eventbridge-role-${ENVIRONMENT}" \
  --policy-name "${PROJECT_NAME}-ecs-runtask-${ENVIRONMENT}" \
  --policy-document "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
      \"Effect\": \"Allow\",
      \"Action\": [\"ecs:RunTask\"],
      \"Resource\": \"${TASK_DEF_ARN}\"
    }, {
      \"Effect\": \"Allow\",
      \"Action\": [\"iam:PassRole\"],
      \"Resource\": \"*\",
      \"Condition\": {
        \"StringEquals\": {
          \"iam:PassedToService\": \"ecs-tasks.amazonaws.com\"
        }
      }
    }]
  }"

log_info "IAM role configured: ${ROLE_ARN}"

log_info "Batch job scheduling configured successfully"
log_info "Rule ARN: ${RULE_ARN}"
log_info "Schedule: ${SCHEDULE}"

