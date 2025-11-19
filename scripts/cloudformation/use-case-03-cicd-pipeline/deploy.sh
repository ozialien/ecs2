#!/bin/bash
# CloudFormation Deployment Script for Use Case 3: CI/CD Pipeline Setup

set -euo pipefail

PROJECT_NAME="${1:-myapp}"
ENVIRONMENT="${2:-dev}"
AWS_REGION="${AWS_REGION:-us-east-1}"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
UNIQUE_ID="${UNIQUE_ID:-${TIMESTAMP}}"
STACK_NAME="${PROJECT_NAME}-03-cicd-pipeline-${ENVIRONMENT}-${UNIQUE_ID}"

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
    local action=$1
    log_info "${action^}ing stack: ${STACK_NAME}"
    
    if [ -f "${PARAMETERS_FILE}" ]; then
        aws cloudformation ${action}-stack \
            --stack-name "${STACK_NAME}" \
            --template-body file://"${TEMPLATE_FILE}" \
            --parameters file://"${PARAMETERS_FILE}" \
            --capabilities CAPABILITY_NAMED_IAM \
            --region "${AWS_REGION}" \
            --tags Key=Project,Value="${PROJECT_NAME}" Key=Environment,Value="${ENVIRONMENT}" Key=UseCase,Value=03-cicd-pipeline
    else
        log_warn "Parameters file not found, using defaults"
        aws cloudformation ${action}-stack \
            --stack-name "${STACK_NAME}" \
            --template-body file://"${TEMPLATE_FILE}" \
            --parameters \
                ParameterKey=ProjectName,ParameterValue="${PROJECT_NAME}" \
                ParameterKey=Environment,ParameterValue="${ENVIRONMENT}" \
            --capabilities CAPABILITY_NAMED_IAM \
            --region "${AWS_REGION}" \
            --tags Key=Project,Value="${PROJECT_NAME}" Key=Environment,Value="${ENVIRONMENT}" Key=UseCase,Value=03-cicd-pipeline
    fi
    
    aws cloudformation wait stack-${action}-complete --stack-name "${STACK_NAME}" --region "${AWS_REGION}"
    log_info "Stack ${action} completed"
}

main() {
    log_info "Deploying CI/CD pipeline for ${PROJECT_NAME} in ${ENVIRONMENT}"
    validate_template
    
    if stack_exists; then
        deploy_stack "update"
    else
        deploy_stack "create"
    fi
    
    aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${AWS_REGION}" --query 'Stacks[0].Outputs' --output table
}

main "$@"

