# Execution Guide - ECS Use Cases Scripts

> **Purpose**: Simple guide for dev/ops/infrastructure teams to execute use cases  
> **Formats**: CDK, CloudFormation, Ansible  
> **Design**: Idempotent, no stack clashes, can run infinite times

---

## 🎯 Quick Start

### Step 1: Set Up IAM Prerequisites (One-Time)

**Choose one method:**

#### Option A: AWS CLI Script
```bash
cd scripts/prerequisites
export PROJECT_NAME=myapp
export ENVIRONMENT=dev
./iam-prerequisites.sh
```

#### Option B: CloudFormation
```bash
aws cloudformation create-stack \
  --stack-name iam-prerequisites \
  --template-body file://scripts/prerequisites/iam-prerequisites.yaml \
  --capabilities CAPABILITY_NAMED_IAM
```

#### Option C: CDK
```bash
cd scripts/prerequisites
cdk deploy
```

**Verify IAM roles created:**
```bash
aws iam list-roles --query 'Roles[?contains(RoleName, `myapp`)].RoleName'
```

---

### Step 2: Configure Environment

```bash
# Set environment variables
export PROJECT_NAME=myapp
export ENVIRONMENT=dev
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
```

---

### Step 3: Execute Use Cases

## Use Case 1: Infrastructure Provisioning

### CDK
```bash
cd scripts/cdk/use-case-01-infrastructure
npm install
npm run build
cdk deploy --context project=$PROJECT_NAME --context environment=$ENVIRONMENT
```

### CloudFormation
```bash
cd scripts/cloudformation/use-case-01-infrastructure
./deploy.sh $PROJECT_NAME $ENVIRONMENT
```

### Ansible
```bash
cd scripts/ansible/use-case-01-infrastructure
ansible-playbook main.yml -e project=$PROJECT_NAME -e env=$ENVIRONMENT
```

---

## 📋 Use Case Execution Matrix

| Use Case | CDK | CloudFormation | Ansible | Description |
|----------|-----|----------------|---------|-------------|
| 01 - Infrastructure | ✅ | ✅ | ✅ | Cluster, VPC, IAM, Load Balancer |
| 02 - ECR Repository | ✅ | ✅ | ✅ | ECR repos, scanning, lifecycle |
| 03 - CI/CD Pipeline | ✅ | ✅ | ✅ | CodePipeline, CodeBuild |
| 06 - Normal Deployment | ✅ | ✅ | ✅ | ECS Service, Task Definition |

*Note: All use cases follow the same pattern - see individual READMEs in each directory*

---

## 🔄 Execution Patterns

### Pattern 1: Single Use Case
```bash
# Execute one use case
cd scripts/{tool}/use-case-XX-{name}
# Follow README instructions
```

### Pattern 2: All Use Cases in Sequence
```bash
# Execute all use cases in order
for usecase in 01 02 03 06; do
  cd scripts/cdk/use-case-${usecase}-*
  cdk deploy --context project=$PROJECT_NAME --context environment=$ENVIRONMENT
done
```

### Pattern 3: Environment-Specific
```bash
# Deploy to multiple environments
for env in dev staging prod; do
  export ENVIRONMENT=$env
  # Execute use cases
done
```

---

## 🛡️ Stack Naming & Clash Prevention

### CDK
- Stack name format: `{project}-{usecase}-{name}-{environment}-{uniqueId}`
- Unique ID: Date timestamp or custom context value
- Example: `myapp-01-infrastructure-prod-20240101`

### CloudFormation
- Stack name format: `{project}-{usecase}-{name}-{environment}-{timestamp}`
- Timestamp: Generated automatically in deploy script
- Example: `myapp-01-infrastructure-prod-20240101120000`

### Ansible
- Resource names: `{project}-{resource}-{environment}`
- Unique ID: Timestamp or custom variable
- Example: `myapp-cluster-prod`

**Result**: No stack name clashes, can run infinite times

---

## ✅ Idempotency Guarantees

### CDK
- Uses CDK's built-in change detection
- Updates existing stacks instead of creating new ones
- Resources are updated in-place when possible

### CloudFormation
- Uses `create-stack` or `update-stack` based on existence
- Change sets available for review
- Rollback on failure

### Ansible
- Built-in idempotency in all modules
- Check mode available (`--check`)
- Only changes what's different

---

## 🔍 Verification

### Check Stack Status
```bash
# CDK
cdk list

# CloudFormation
aws cloudformation list-stacks --query 'StackSummaries[?contains(StackName, `myapp`)].{Name:StackName,Status:StackStatus}'

# Ansible
ansible-playbook main.yml --check
```

### Verify Resources
```bash
# ECS Cluster
aws ecs list-clusters

# VPC
aws ec2 describe-vpcs --filters "Name=tag:Project,Values=myapp"

# IAM Roles
aws iam list-roles --query 'Roles[?contains(RoleName, `myapp`)].RoleName'
```

---

## 🚨 Troubleshooting

### Stack Already Exists
**CDK**: Use different `uniqueId` in context
```bash
cdk deploy --context uniqueId=custom-id
```

**CloudFormation**: Script automatically updates existing stacks

**Ansible**: Playbook is idempotent, safe to re-run

### IAM Roles Not Found
1. Run IAM prerequisites script first
2. Verify roles exist: `aws iam get-role --role-name {role-name}`
3. Check role names match configuration

### VPC CIDR Conflicts
- Use different `vpcCidr` in configuration
- Or use existing VPC (modify scripts)

### Region Mismatches
- Ensure `AWS_REGION` environment variable is set
- Or specify in context/parameters

---

## 📝 Best Practices

1. **Always Run IAM Prerequisites First**
   - Required for all use cases
   - One-time setup per project/environment

2. **Use Environment Variables**
   - Consistent naming across all tools
   - Easy to switch environments

3. **Review Before Deploy**
   - CDK: `cdk diff`
   - CloudFormation: Create change set
   - Ansible: Use `--check` mode

4. **Tag Everything**
   - All resources tagged with Project, Environment
   - Easy to identify and manage

5. **Version Control**
   - Commit all scripts to version control
   - Track changes and rollbacks

---

## 🔗 Related Documentation

- [Scripts README](./README.md)
- [IAM Prerequisites](./prerequisites/iam-prerequisites.md)
- [Use Cases Documentation](../ecs-deployment-use-cases-augmented.md)

---

## 💡 Tips

- **Start Small**: Deploy Use Case 1 first, verify, then proceed
- **Use Check Mode**: Always test with `--check` or `cdk diff` first
- **Monitor Outputs**: Save stack outputs for next use cases
- **Clean Up**: Use `cdk destroy` or `aws cloudformation delete-stack` for testing

---

**Status**: ✅ Production-Ready | **Last Updated**: 2024

