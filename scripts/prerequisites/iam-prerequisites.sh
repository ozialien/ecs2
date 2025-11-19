#!/bin/bash
# IAM Prerequisites Setup Script
# Creates all required IAM roles for ECS deployments
# Can be run multiple times (idempotent)

set -euo pipefail

# Configuration
PROJECT_NAME="${PROJECT_NAME:-myapp}"
ENVIRONMENT="${ENVIRONMENT:-dev}"
AWS_REGION="${AWS_REGION:-us-east-1}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to create IAM role if it doesn't exist
create_role_if_not_exists() {
    local role_name=$1
    local trust_policy=$2
    local description=$3
    
    log_info "Checking role: ${role_name}"
    
    if aws iam get-role --role-name "${role_name}" &>/dev/null; then
        log_warn "Role ${role_name} already exists, skipping..."
        return 0
    fi
    
    log_info "Creating role: ${role_name}"
    aws iam create-role \
        --role-name "${role_name}" \
        --assume-role-policy-document "${trust_policy}" \
        --description "${description}" \
        --tags Key=Project,Value="${PROJECT_NAME}" Key=Environment,Value="${ENVIRONMENT}" Key=ManagedBy,Value=Script
    
    log_info "Role ${role_name} created successfully"
}

# Function to attach managed policy to role
attach_managed_policy() {
    local role_name=$1
    local policy_arn=$2
    
    log_info "Attaching policy ${policy_arn} to role ${role_name}"
    aws iam attach-role-policy \
        --role-name "${role_name}" \
        --policy-arn "${policy_arn}" || log_warn "Policy may already be attached"
}

# Function to create inline policy
create_inline_policy() {
    local role_name=$1
    local policy_name=$2
    local policy_document=$3
    
    log_info "Creating inline policy ${policy_name} for role ${role_name}"
    aws iam put-role-policy \
        --role-name "${role_name}" \
        --policy-name "${policy_name}" \
        --policy-document "${policy_document}" || log_warn "Policy may already exist"
}

# Trust policy for ECS tasks
ECS_TASK_TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}'

# Trust policy for ECS service
ECS_SERVICE_TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}'

# Trust policy for CodeBuild
CODEBUILD_TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "codebuild.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}'

# Trust policy for CodePipeline
CODEPIPELINE_TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "codepipeline.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}'

# ECS Task Execution Role Policy
TASK_EXECUTION_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:log-group:/ecs/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameters"
      ],
      "Resource": "arn:aws:ssm:*:*:parameter/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "kms:ViaService": [
            "secretsmanager.us-east-1.amazonaws.com",
            "ssm.us-east-1.amazonaws.com"
          ]
        }
      }
    }
  ]
}'

# ECS Task Role Policy (minimal - application-specific)
TASK_ROLE_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:log-group:/ecs/*"
    }
  ]
}'

# CodeBuild Role Policy
CODEBUILD_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:RegisterTaskDefinition",
        "ecs:DescribeTaskDefinition",
        "ecs:UpdateService",
        "ecs:DescribeServices"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "*"
    }
  ]
}'

# CodePipeline Role Policy
CODEPIPELINE_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "codebuild:BatchGetBuilds",
        "codebuild:StartBuild"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:DescribeServices",
        "ecs:DescribeTaskDefinition",
        "ecs:DescribeTasks",
        "ecs:ListTasks",
        "ecs:RegisterTaskDefinition",
        "ecs:UpdateService"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:PassRole"
      ],
      "Resource": "*",
      "Condition": {
        "StringEqualsIfExists": {
          "iam:PassedToService": [
            "ecs-tasks.amazonaws.com",
            "codebuild.amazonaws.com"
          ]
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:GetObjectVersion",
        "s3:PutObject",
        "s3:GetBucketVersioning",
        "s3:PutBucketVersioning"
      ],
      "Resource": "*"
    }
  ]
}'

# ECS Exec Policy (for debugging)
ECS_EXEC_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssmmessages:CreateControlChannel",
        "ssmmessages:CreateDataChannel",
        "ssmmessages:OpenControlChannel",
        "ssmmessages:OpenDataChannel"
      ],
      "Resource": "*"
    }
  ]
}'

# Main execution
main() {
    log_info "Setting up IAM prerequisites for ${PROJECT_NAME} in ${ENVIRONMENT}"
    log_info "Account ID: ${ACCOUNT_ID}"
    log_info "Region: ${AWS_REGION}"
    
    # 1. ECS Task Execution Role
    create_role_if_not_exists \
        "${PROJECT_NAME}-ecs-task-execution-role-${ENVIRONMENT}" \
        "${ECS_TASK_TRUST_POLICY}" \
        "ECS Task Execution Role for ${PROJECT_NAME} in ${ENVIRONMENT}"
    
    create_inline_policy \
        "${PROJECT_NAME}-ecs-task-execution-role-${ENVIRONMENT}" \
        "ECSTaskExecutionPolicy" \
        "${TASK_EXECUTION_POLICY}"
    
    # 2. ECS Task Role
    create_role_if_not_exists \
        "${PROJECT_NAME}-ecs-task-role-${ENVIRONMENT}" \
        "${ECS_TASK_TRUST_POLICY}" \
        "ECS Task Role for ${PROJECT_NAME} in ${ENVIRONMENT}"
    
    create_inline_policy \
        "${PROJECT_NAME}-ecs-task-role-${ENVIRONMENT}" \
        "ECSTaskRolePolicy" \
        "${TASK_ROLE_POLICY}"
    
    # 3. ECS Service Role (or use AWS managed role)
    log_info "ECS Service Role: Using AWS managed role AWSServiceRoleForECS"
    log_info "If not exists, it will be created automatically by AWS"
    
    # 4. CodeBuild Role
    create_role_if_not_exists \
        "${PROJECT_NAME}-codebuild-role-${ENVIRONMENT}" \
        "${CODEBUILD_TRUST_POLICY}" \
        "CodeBuild Role for ${PROJECT_NAME} in ${ENVIRONMENT}"
    
    create_inline_policy \
        "${PROJECT_NAME}-codebuild-role-${ENVIRONMENT}" \
        "CodeBuildPolicy" \
        "${CODEBUILD_POLICY}"
    
    # 5. CodePipeline Role
    create_role_if_not_exists \
        "${PROJECT_NAME}-codepipeline-role-${ENVIRONMENT}" \
        "${CODEPIPELINE_TRUST_POLICY}" \
        "CodePipeline Role for ${PROJECT_NAME} in ${ENVIRONMENT}"
    
    create_inline_policy \
        "${PROJECT_NAME}-codepipeline-role-${ENVIRONMENT}" \
        "CodePipelinePolicy" \
        "${CODEPIPELINE_POLICY}"
    
    # 6. ECS Exec Role (optional - can be added to task execution role)
    read -p "Create separate ECS Exec role? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        create_role_if_not_exists \
            "${PROJECT_NAME}-ecs-exec-role-${ENVIRONMENT}" \
            "${ECS_TASK_TRUST_POLICY}" \
            "ECS Exec Role for ${PROJECT_NAME} in ${ENVIRONMENT}"
        
        create_inline_policy \
            "${PROJECT_NAME}-ecs-exec-role-${ENVIRONMENT}" \
            "ECSExecPolicy" \
            "${ECS_EXEC_POLICY}"
    else
        log_info "Skipping ECS Exec role (can be added to task execution role later)"
    fi
    
    # 7. Create ECS Service-Linked Role (if not exists)
    log_info "Checking ECS Service-Linked Role..."
    if ! aws iam get-role --role-name aws-service-role/ecs.amazonaws.com/AWSServiceRoleForECS &>/dev/null; then
        log_info "Creating ECS Service-Linked Role..."
        aws iam create-service-linked-role \
            --aws-service-name ecs.amazonaws.com || log_warn "Service-linked role may already exist"
    else
        log_info "ECS Service-Linked Role already exists"
    fi
    
    log_info "IAM prerequisites setup complete!"
    log_info "Created roles:"
    log_info "  - ${PROJECT_NAME}-ecs-task-execution-role-${ENVIRONMENT}"
    log_info "  - ${PROJECT_NAME}-ecs-task-role-${ENVIRONMENT}"
    log_info "  - ${PROJECT_NAME}-codebuild-role-${ENVIRONMENT}"
    log_info "  - ${PROJECT_NAME}-codepipeline-role-${ENVIRONMENT}"
}

# Run main function
main "$@"

