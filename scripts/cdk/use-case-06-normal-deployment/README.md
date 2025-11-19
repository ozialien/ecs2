# Use Case 6: Normal Deployment - CDK

> **Purpose**: Deploy ECS Service with Task Definition  
> **Format**: AWS CDK (TypeScript)  
> **Idempotent**: Yes

## Quick Start

```bash
npm install
npm run build
cdk deploy \
  --context project=myapp \
  --context environment=dev \
  --context clusterName=myapp-cluster-dev \
  --context serviceName=myapp-service-dev \
  --context containerImage=account.dkr.ecr.region.amazonaws.com/repo:tag \
  --context containerPort=80 \
  --context cpu=256 \
  --context memory=512 \
  --context desiredCount=2
```

## Configuration

| Context Variable | Required | Description |
|-----------------|----------|-------------|
| `clusterName` | Yes | ECS cluster name |
| `serviceName` | Yes | ECS service name |
| `containerImage` | Yes | Container image URI |
| `containerPort` | No | Container port (default: 80) |
| `cpu` | No | CPU units (default: 256) |
| `memory` | No | Memory in MB (default: 512) |
| `desiredCount` | No | Desired task count (default: 2) |
| `enableCircuitBreaker` | No | Enable circuit breaker (default: true) |
| `targetGroupArn` | No | ALB target group ARN (optional) |
| `taskExecutionRoleArn` | No | Task execution role ARN (optional) |
| `taskRoleArn` | No | Task role ARN (optional) |

## Outputs

- Service Name
- Service ARN
- Task Definition ARN

