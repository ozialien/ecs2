#!/bin/bash
# CloudFormation Deployment Script for Use Case 1: Infrastructure Provisioning
# Idempotent - can be run multiple times without clashes

set -euo pipefail

# Configuration
PROJECT_NAME="${1:-myapp}"
ENVIRONMENT="${2:-dev}"
AWS_REGION="${AWS_REGION:-us-east-1}"
# Use fixed stack name for idempotency - set STACK_NAME env var to override
STACK_NAME="${STACK_NAME:-${PROJECT_NAME}-01-infrastructure-${ENVIRONMENT}}"

# Template file
TEMPLATE_FILE="template.yaml"
PARAMETERS_FILE="parameters-${ENVIRONMENT}.json"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if stack exists
stack_exists() {
    aws cloudformation describe-stacks \
        --stack-name "${STACK_NAME}" \
        --region "${AWS_REGION}" \
        &>/dev/null
}

# Get stack status
get_stack_status() {
    aws cloudformation describe-stacks \
        --stack-name "${STACK_NAME}" \
        --region "${AWS_REGION}" \
        --query 'Stacks[0].StackStatus' \
        --output text 2>/dev/null || echo "NOT_FOUND"
}

# Validate template
validate_template() {
    log_info "Validating CloudFormation template..."
    aws cloudformation validate-template \
        --template-body file://"${TEMPLATE_FILE}" \
        --region "${AWS_REGION}" > /dev/null
    log_info "Template validation successful"
}

# Deploy stack (idempotent - uses deploy command which handles create/update automatically)
deploy_stack() {
    log_info "Deploying stack: ${STACK_NAME} (idempotent - will create or update as needed)"
    
    if [ -f "${PARAMETERS_FILE}" ]; then
        aws cloudformation deploy \
            --stack-name "${STACK_NAME}" \
            --template-file "${TEMPLATE_FILE}" \
            --parameter-overrides file://"${PARAMETERS_FILE}" \
            --capabilities CAPABILITY_NAMED_IAM \
            --region "${AWS_REGION}" \
            --tags \
                Project="${PROJECT_NAME}" \
                Environment="${ENVIRONMENT}" \
                UseCase=01-infrastructure \
                ManagedBy=Script
    else
        aws cloudformation deploy \
            --stack-name "${STACK_NAME}" \
            --template-file "${TEMPLATE_FILE}" \
            --parameter-overrides \
                ProjectName="${PROJECT_NAME}" \
                Environment="${ENVIRONMENT}" \
            --capabilities CAPABILITY_NAMED_IAM \
            --region "${AWS_REGION}" \
            --tags \
                Project="${PROJECT_NAME}" \
                Environment="${ENVIRONMENT}" \
                UseCase=01-infrastructure \
                ManagedBy=Script
    fi
    
    log_info "Stack deployment completed successfully"
}

# Main execution
main() {
    log_info "Starting deployment for ${PROJECT_NAME} in ${ENVIRONMENT}"
    log_info "Stack name: ${STACK_NAME}"
    log_info "Region: ${AWS_REGION}"
    
    # Validate template
    validate_template
    
    # Deploy stack (idempotent - deploy command handles create/update automatically)
    deploy_stack
    
    # Get outputs
    log_info "Stack outputs:"
    aws cloudformation describe-stacks \
        --stack-name "${STACK_NAME}" \
        --region "${AWS_REGION}" \
        --query 'Stacks[0].Outputs' \
        --output table
    
    log_info "Deployment complete!"
}

# Run main
main "$@"

