#!/bin/bash
# CloudFormation Deployment Script for Use Case 1: Infrastructure Provisioning
# Idempotent - can be run multiple times without clashes

set -euo pipefail

# Configuration
PROJECT_NAME="${1:-myapp}"
ENVIRONMENT="${2:-dev}"
AWS_REGION="${AWS_REGION:-us-east-1}"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
UNIQUE_ID="${UNIQUE_ID:-${TIMESTAMP}}"
STACK_NAME="${PROJECT_NAME}-01-infrastructure-${ENVIRONMENT}-${UNIQUE_ID}"

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

# Create or update stack
deploy_stack() {
    local action=$1
    
    log_info "Deploying stack: ${STACK_NAME}"
    
    if [ -f "${PARAMETERS_FILE}" ]; then
        aws cloudformation ${action}-stack \
            --stack-name "${STACK_NAME}" \
            --template-body file://"${TEMPLATE_FILE}" \
            --parameters file://"${PARAMETERS_FILE}" \
            --capabilities CAPABILITY_NAMED_IAM \
            --region "${AWS_REGION}" \
            --tags \
                Key=Project,Value="${PROJECT_NAME}" \
                Key=Environment,Value="${ENVIRONMENT}" \
                Key=UseCase,Value=01-infrastructure \
                Key=ManagedBy,Value=Script
    else
        aws cloudformation ${action}-stack \
            --stack-name "${STACK_NAME}" \
            --template-body file://"${TEMPLATE_FILE}" \
            --parameters \
                ParameterKey=ProjectName,ParameterValue="${PROJECT_NAME}" \
                ParameterKey=Environment,ParameterValue="${ENVIRONMENT}" \
            --capabilities CAPABILITY_NAMED_IAM \
            --region "${AWS_REGION}" \
            --tags \
                Key=Project,Value="${PROJECT_NAME}" \
                Key=Environment,Value="${ENVIRONMENT}" \
                Key=UseCase,Value=01-infrastructure \
                Key=ManagedBy,Value=Script
    fi
    
    log_info "Waiting for stack ${action} to complete..."
    aws cloudformation wait stack-${action}-complete \
        --stack-name "${STACK_NAME}" \
        --region "${AWS_REGION}"
    
    log_info "Stack ${action} completed successfully"
}

# Main execution
main() {
    log_info "Starting deployment for ${PROJECT_NAME} in ${ENVIRONMENT}"
    log_info "Stack name: ${STACK_NAME}"
    log_info "Region: ${AWS_REGION}"
    
    # Validate template
    validate_template
    
    # Check if stack exists
    if stack_exists; then
        log_warn "Stack ${STACK_NAME} already exists, updating..."
        deploy_stack "update"
    else
        log_info "Stack ${STACK_NAME} does not exist, creating..."
        deploy_stack "create"
    fi
    
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

