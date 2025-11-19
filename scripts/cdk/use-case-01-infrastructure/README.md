# Use Case 1: Infrastructure Provisioning - CDK

> **Purpose**: Deploy ECS infrastructure (Cluster, VPC, IAM, Load Balancer)  
> **Format**: AWS CDK (TypeScript)  
> **Idempotent**: Yes - can be run multiple times without clashes

## Prerequisites

1. **IAM Prerequisites**: Run `../../prerequisites/iam-prerequisites.sh` first
2. **AWS CLI**: Configured with appropriate credentials
3. **Node.js**: v18+ and npm installed
4. **CDK CLI**: `npm install -g aws-cdk`

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Deploy
cdk deploy --context project=myapp --context environment=dev

# Or with custom values
cdk deploy \
  --context project=myapp \
  --context environment=prod \
  --context region=us-east-1 \
  --context vpcCidr=10.0.0.0/16 \
  --context enableContainerInsights=true \
  --context enableLoadBalancer=true \
  --context loadBalancerType=application
```

## Configuration

### Context Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `project` | `myapp` | Project name (used in resource naming) |
| `environment` | `dev` | Environment (dev, staging, prod) |
| `region` | `us-east-1` | AWS region |
| `account` | From env | AWS account ID |
| `vpcCidr` | `10.0.0.0/16` | VPC CIDR block |
| `enableNatGateway` | `true` | Enable NAT Gateway for private subnets |
| `clusterName` | `{project}-cluster-{env}` | ECS cluster name |
| `enableContainerInsights` | `true` | Enable Container Insights |
| `enableLoadBalancer` | `true` | Create load balancer |
| `loadBalancerType` | `application` | Load balancer type (application/network) |
| `enableServiceDiscovery` | `false` | Enable service discovery |
| `serviceDiscoveryNamespace` | `{project}.local` | Service discovery namespace |
| `uniqueId` | Current date | Unique identifier for stack name |

### Stack Naming

Stack name format: `{project}-01-infrastructure-{environment}-{uniqueId}`

Example: `myapp-01-infrastructure-prod-20240101`

This ensures:
- No stack name clashes
- Can deploy multiple times
- Easy identification of stacks

## What Gets Created

1. **VPC**
   - Multi-AZ subnets (public and private)
   - NAT Gateways (if enabled)
   - VPC endpoints (S3, ECR, CloudWatch Logs)

2. **Security Groups**
   - ALB security group
   - ECS task security group

3. **IAM Roles**
   - Task Execution Role (references existing role)
   - Task Role (references existing role)

4. **CloudWatch Logs**
   - ECS log group
   - Container Insights log group

5. **ECS Cluster**
   - Cluster with Container Insights
   - Service discovery (if enabled)

6. **Load Balancer** (optional)
   - Application or Network Load Balancer
   - Target group with health checks

## Outputs

The stack exports:
- VPC ID
- Cluster Name and ARN
- Task Execution Role ARN
- Task Role ARN
- Load Balancer ARN and DNS Name (if created)
- Target Group ARN (if created)
- Service Discovery Namespace ID (if created)

## Idempotency

This stack is idempotent:
- Running multiple times updates existing resources
- Stack name includes unique ID to prevent clashes
- Resources are tagged for easy identification

## Cleanup

```bash
# Destroy stack
cdk destroy

# Or with context
cdk destroy --context project=myapp --context environment=dev
```

## Troubleshooting

### Stack name already exists
- Use different `uniqueId` in context
- Or delete existing stack first

### IAM roles not found
- Run `../../prerequisites/iam-prerequisites.sh` first
- Or create roles manually

### VPC CIDR conflicts
- Use different `vpcCidr` in context
- Or use existing VPC (modify stack)

## Next Steps

After infrastructure is created:
1. Set up ECR repositories (Use Case 2)
2. Set up CI/CD pipeline (Use Case 3)
3. Deploy first service (Use Case 6)

