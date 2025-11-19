#!/bin/bash
# Batch create template files for remaining use cases

USE_CASES=(
  "04-image-build"
  "05-image-scan"
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

for uc in "${USE_CASES[@]}"; do
  # Create basic README files
  echo "# Use Case ${uc:3:2}: $(echo ${uc:6} | tr '-' ' ' | sed 's/\b\(.\)/\u\1/g')" > cdk/use-case-${uc}/README.md
  echo "# Use Case ${uc:3:2}: $(echo ${uc:6} | tr '-' ' ' | sed 's/\b\(.\)/\u\1/g')" > ansible/use-case-${uc}/README.md
  echo "Created READMEs for ${uc}"
done

echo "Template files created for remaining use cases"
