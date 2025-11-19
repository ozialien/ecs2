#!/bin/bash
# Script to create directory structure for all use cases

USE_CASES=(
  "03-cicd-pipeline"
  "04-image-build"
  "05-image-scan"
  "06-normal-deployment"
  "07-emergency-hotfix"
  "08-rollback"
  "09-config-change"
  "10-additional-infrastructure"
  "11-blue-green-deployment"
  "12-scheduled-scan"
  "13-rolling-deployment"
  "14-canary-deployment"
  "15-batch-job"
  "16-auto-scaling"
  "17-multi-region"
  "18-ecs-exec"
  "19-multi-container"
)

for usecase in "${USE_CASES[@]}"; do
  # Create directories
  mkdir -p cdk/use-case-${usecase}/{bin,lib}
  mkdir -p cloudformation/use-case-${usecase}
  mkdir -p ansible/use-case-${usecase}
  echo "Created structure for use-case-${usecase}"
done

echo "Directory structure created for all use cases"
