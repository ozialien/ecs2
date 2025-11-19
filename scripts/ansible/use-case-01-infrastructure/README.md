# Use Case 1: Infrastructure Provisioning - Ansible

> **Purpose**: Deploy ECS infrastructure using Ansible  
> **Format**: Ansible Playbook  
> **Idempotent**: Yes - can be run multiple times

## Prerequisites

1. **IAM Prerequisites**: Run `../../prerequisites/iam-prerequisites.sh` first
2. **Ansible**: v2.9+ installed
3. **AWS Collections**: Install required Ansible collections
4. **AWS CLI**: Configured with appropriate credentials

## Install Ansible Collections

```bash
ansible-galaxy collection install amazon.aws
ansible-galaxy collection install community.aws
```

## Quick Start

```bash
# Basic deployment
ansible-playbook main.yml -e project=myapp -e env=dev

# With custom values
ansible-playbook main.yml \
  -e project=myapp \
  -e env=prod \
  -e region=us-east-1 \
  -e vpc_cidr=10.0.0.0/16 \
  -e enable_container_insights=true \
  -e enable_load_balancer=true \
  -e load_balancer_type=application
```

## Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `project` | `myapp` | Project name |
| `env` | `dev` | Environment |
| `region` | `us-east-1` | AWS region |
| `unique_id` | Current timestamp | Unique identifier |
| `vpc_cidr` | `10.0.0.0/16` | VPC CIDR block |
| `cluster_name` | `{project}-cluster-{env}` | ECS cluster name |
| `enable_container_insights` | `true` | Enable Container Insights |
| `enable_load_balancer` | `true` | Create load balancer |
| `load_balancer_type` | `application` | Load balancer type |
| `enable_service_discovery` | `false` | Enable service discovery |
| `service_discovery_namespace` | `{project}.local` | Service discovery namespace |

## Check Mode (Dry Run)

```bash
# Preview changes without applying
ansible-playbook main.yml -e project=myapp -e env=dev --check
```

## Idempotency

This playbook is idempotent:
- Running multiple times updates existing resources
- Resources are tagged for identification
- Uses Ansible's built-in idempotency

## What Gets Created

1. VPC with public/private subnets
2. Internet Gateway and NAT Gateways
3. Security Groups (ALB and ECS)
4. CloudWatch Log Groups
5. ECS Cluster with Container Insights
6. Service Discovery Namespace (optional)
7. Load Balancer and Target Group (optional)

## Next Steps

After infrastructure is created:
1. Set up ECR repositories (Use Case 2)
2. Set up CI/CD pipeline (Use Case 3)
3. Deploy first service (Use Case 6)

