#!/bin/bash
# CloudFormation Deployment Script for Use Case 6: Normal Deployment

set -euo pipefail

PROJECT_NAME="${1:-myapp}"
ENVIRONMENT="${2:-dev}"
AWS_REGION="${AWS_REGION:-us-east-1}"
# Use fixed stack name for idempotency - set STACK_NAME env var to override
STACK_NAME="${STACK_NAME:-${PROJECT_NAME}-06-normal-deployment-${ENVIRONMENT}}"

TEMPLATE_FILE="template.yaml"
PARAMETERS_FILE="parameters-${ENVIRONMENT}.json"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

stack_exists() {
    aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${AWS_REGION}" &>/dev/null
}

validate_template() {
    log_info "Validating template..."
    aws cloudformation validate-template --template-body file://"${TEMPLATE_FILE}" --region "${AWS_REGION}" > /dev/null
}

deploy_stack() {
    log_info "Deploying stack: ${STACK_NAME} (idempotent - will create or update as needed)"
    
    if [ -f "${PARAMETERS_FILE}" ]; then
        aws cloudformation deploy \
            --stack-name "${STACK_NAME}" \
            --template-file "${TEMPLATE_FILE}" \
            --parameter-overrides file://"${PARAMETERS_FILE}" \
            --capabilities CAPABILITY_NAMED_IAM \
            --region "${AWS_REGION}" \
            --tags Project="${PROJECT_NAME}" Environment="${ENVIRONMENT}" UseCase=06-normal-deployment
    else
        log_warn "Parameters file not found, using defaults"
        aws cloudformation deploy \
            --stack-name "${STACK_NAME}" \
            --template-file "${TEMPLATE_FILE}" \
            --parameter-overrides \
                ProjectName="${PROJECT_NAME}" \
                Environment="${ENVIRONMENT}" \
            --capabilities CAPABILITY_NAMED_IAM \
            --region "${AWS_REGION}" \
            --tags Project="${PROJECT_NAME}" Environment="${ENVIRONMENT}" UseCase=06-normal-deployment
    fi
    
    log_info "Stack deployment completed"
}

main() {
    log_info "Deploying ECS service for ${PROJECT_NAME} in ${ENVIRONMENT}"
    validate_template
    
    deploy_stack
    
    aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${AWS_REGION}" --query 'Stacks[0].Outputs' --output table
}

main "$@"

