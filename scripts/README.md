# ECS Use Cases - Actionable Scripts

> **Purpose**: Reusable, idempotent infrastructure code for all ECS use cases  
> **Formats**: AWS CDK, CloudFormation, Ansible  
> **Design**: Stack naming prevents clashes, can be executed infinite times

## 📁 Directory Structure

```
scripts/
├── README.md (this file)
├── prerequisites/
│   ├── iam-prerequisites.md
│   ├── iam-prerequisites.sh (AWS CLI)
│   ├── iam-prerequisites-cdk.ts
│   └── iam-prerequisites.yaml (CloudFormation)
├── cdk/
│   ├── use-case-01-infrastructure/
│   ├── use-case-02-ecr-repository/
│   ├── use-case-03-cicd-pipeline/
│   └── ...
├── cloudformation/
│   ├── use-case-01-infrastructure/
│   ├── use-case-02-ecr-repository/
│   ├── use-case-03-cicd-pipeline/
│   └── ...
└── ansible/
    ├── use-case-01-infrastructure/
    ├── use-case-02-ecr-repository/
    ├── use-case-03-cicd-pipeline/
    └── ...
```

---

## 🎯 Design Principles

### 1. **Idempotent Execution**
- All scripts can be run multiple times without side effects
- Stack names include unique identifiers (project, environment, timestamp)
- Resources are created only if they don't exist

### 2. **Stack Naming Convention**
```
{ProjectName}-{UseCaseNumber}-{UseCaseName}-{Environment}-{UniqueId}
```
Example: `myapp-01-infrastructure-prod-20240101`

### 3. **Parameter-Driven**
- All configurations via parameters/config files
- No hardcoded values
- Environment-specific configurations

### 4. **IAM Prerequisites**
- IAM roles/policies created separately
- Can be included in stack or created independently
- Documented in `prerequisites/iam-prerequisites.md`

---

## 🚀 Quick Start

### Prerequisites

1. **Set Up IAM Prerequisites** (One-time setup)
   ```bash
   # Option 1: AWS CLI
   ./prerequisites/iam-prerequisites.sh
   
   # Option 2: CloudFormation
   aws cloudformation create-stack --stack-name iam-prerequisites --template-body file://prerequisites/iam-prerequisites.yaml
   
   # Option 3: CDK
   cd prerequisites && cdk deploy
   ```

2. **Configure Environment**
   ```bash
   export PROJECT_NAME="myapp"
   export ENVIRONMENT="dev"
   export AWS_REGION="us-east-1"
   export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
   ```

### Execution

**CDK:**
```bash
cd cdk/use-case-01-infrastructure
npm install
cdk deploy --context project=myapp --context environment=dev
```

**CloudFormation:**
```bash
./cloudformation/use-case-01-infrastructure/deploy.sh myapp dev
```

**Ansible:**
```bash
ansible-playbook ansible/use-case-01-infrastructure/main.yml -e project=myapp -e environment=dev
```

---

## 📋 Use Case Scripts

| Use Case | CDK | CloudFormation | Ansible | Description |
|----------|-----|----------------|---------|-------------|
| 01 - Infrastructure | ✅ | ✅ | ✅ | ECS Cluster, VPC, IAM, Load Balancer |
| 02 - ECR Repository | ✅ | ✅ | ✅ | ECR Repos, Scanning, Lifecycle |
| 03 - CI/CD Pipeline | ✅ | ✅ | ✅ | CodePipeline, CodeBuild |
| 04 - Image Build | ✅ | ✅ | ✅ | CodeBuild buildspec |
| 05 - Image Scan | ✅ | ✅ | ✅ | ECR + Third-party scanning |
| 06 - Normal Deployment | ✅ | ✅ | ✅ | ECS Service, Task Definition |
| 07 - Emergency Hotfix | ✅ | ✅ | ✅ | Manual deployment process |
| 08 - Rollback | ✅ | ✅ | ✅ | Rollback automation |
| 09 - Config Change | ✅ | ✅ | ✅ | Service configuration updates |
| 10 - Additional Infrastructure | ✅ | ✅ | ✅ | Additional resources |
| 11 - Blue/Green | ✅ | ✅ | ✅ | Blue/Green deployment |
| 12 - Scheduled Scan | ✅ | ✅ | ✅ | Scheduled vulnerability scans |
| 13 - Rolling Deployment | ✅ | ✅ | ✅ | Rolling update configuration |
| 14 - Canary Deployment | ✅ | ✅ | ✅ | Canary deployment setup |
| 15 - Batch Job | ✅ | ✅ | ✅ | ECS Task scheduling |
| 16 - Auto-Scaling | ✅ | ✅ | ✅ | Auto-scaling configuration |
| 17 - Multi-Region | ✅ | ✅ | ✅ | Multi-region setup |
| 18 - ECS Exec | ✅ | ✅ | ✅ | ECS Exec enablement |
| 19 - Multi-Container | ✅ | ✅ | ✅ | Multi-container task definitions |

---

## 🔐 IAM Prerequisites

See [IAM Prerequisites Documentation](./prerequisites/iam-prerequisites.md) for:
- Required IAM roles
- Required IAM policies
- Service-linked roles
- Cross-account permissions (if needed)

---

## 📝 Configuration Files

Each use case includes:
- `config.yaml` or `config.json` - Configuration parameters
- `parameters.yaml` - CloudFormation parameters
- `cdk.json` - CDK context configuration
- `deploy.sh` - Deployment script wrapper

---

## 🔄 Execution Flow

1. **Prerequisites Check**
   - Verify IAM roles exist
   - Verify AWS credentials configured
   - Verify required AWS services enabled

2. **Configuration**
   - Load environment-specific config
   - Validate parameters
   - Generate unique stack names

3. **Deployment**
   - Create/update stack
   - Wait for completion
   - Validate outputs

4. **Post-Deployment**
   - Verify resources created
   - Test connectivity
   - Update documentation

---

## 🛠️ Tool-Specific Notes

### AWS CDK
- Uses TypeScript
- Constructs are reusable
- Stack names auto-generated with unique IDs
- Supports multiple environments

### CloudFormation
- Parameterized templates
- Stack names include unique identifiers
- Supports change sets for review
- Nested stacks for complex deployments

### Ansible
- Idempotent playbooks
- Uses AWS modules
- Supports check mode (dry-run)
- Inventory-based configuration

---

## 📚 Additional Resources

- [Use Cases Documentation](../ecs-deployment-use-cases-augmented.md)
- [IAM Prerequisites](./prerequisites/iam-prerequisites.md)
- [Deployment Guide](../README.md)

---

## 🤝 Contributing

When adding new use cases:
1. Follow naming conventions
2. Include all three formats (CDK, CloudFormation, Ansible)
3. Document IAM requirements
4. Test idempotency
5. Update this README

