# Use Case 3: CI/CD Pipeline Setup - CDK

> **Purpose**: Create CodePipeline with CodeBuild for ECS deployments  
> **Format**: AWS CDK (TypeScript)  
> **Idempotent**: Yes

## Quick Start

```bash
npm install
npm run build
cdk deploy \
  --context project=myapp \
  --context environment=dev \
  --context sourceRepository=github.com/user/repo \
  --context codeStarConnectionArn=arn:aws:codestar-connections:region:account:connection/id \
  --context ecrRepositoryUri=account.dkr.ecr.region.amazonaws.com/repo \
  --context ecsClusterName=myapp-cluster-dev \
  --context ecsServiceName=myapp-service
```

## Configuration

| Context Variable | Required | Description |
|-----------------|----------|-------------|
| `sourceRepository` | Yes | GitHub repo (format: owner/repo) |
| `sourceBranch` | No | Branch name (default: main) |
| `codeStarConnectionArn` | Yes* | CodeStar Connection ARN (*required for GitHub) |
| `ecrRepositoryUri` | Yes | ECR repository URI |
| `ecsClusterName` | Yes | ECS cluster name |
| `ecsServiceName` | Yes | ECS service name |
| `enableApprovalGate` | No | Enable manual approval (default: true) |

## Outputs

- Pipeline Name
- Pipeline ARN
- Artifacts Bucket Name

