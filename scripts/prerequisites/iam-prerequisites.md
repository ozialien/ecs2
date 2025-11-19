# IAM Prerequisites for ECS Use Cases

> **Purpose**: Document all IAM roles, policies, and permissions required for ECS deployments  
> **Usage**: Create these before deploying any ECS infrastructure  
> **Options**: AWS CLI, CloudFormation, or CDK

---

## Required IAM Roles

### 1. ECS Task Execution Role

**Purpose**: Allows ECS to pull images from ECR, write logs to CloudWatch, and access secrets.

**Required Permissions**:
- `ecr:GetAuthorizationToken`
- `ecr:BatchCheckLayerAvailability`
- `ecr:GetDownloadUrlForLayer`
- `ecr:BatchGetImage`
- `logs:CreateLogStream`
- `logs:PutLogEvents`
- `secretsmanager:GetSecretValue` (if using Secrets Manager)
- `ssm:GetParameters` (if using Parameter Store)
- `kms:Decrypt` (if using encrypted logs/secrets)

**Trust Policy**:
```json
{
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
}
```

**Role Name Pattern**: `{ProjectName}-ecs-task-execution-role-{Environment}`

---

### 2. ECS Task Role

**Purpose**: Permissions for your application running in containers to access AWS services.

**Required Permissions**: (Application-specific, examples below)
- S3 access (if needed)
- DynamoDB access (if needed)
- SQS/SNS access (if needed)
- Other AWS service permissions as required by your application

**Trust Policy**:
```json
{
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
}
```

**Role Name Pattern**: `{ProjectName}-ecs-task-role-{Environment}`

---

### 3. ECS Service Role

**Purpose**: Allows ECS service to manage load balancers and register targets.

**Required Permissions**:
- `ec2:AuthorizeSecurityGroupIngress`
- `ec2:Describe*`
- `elasticloadbalancing:DeregisterInstancesFromLoadBalancer`
- `elasticloadbalancing:DeregisterTargets`
- `elasticloadbalancing:Describe*`
- `elasticloadbalancing:RegisterInstancesWithLoadBalancer`
- `elasticloadbalancing:RegisterTargets`

**Trust Policy**:
```json
{
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
}
```

**Role Name Pattern**: `{ProjectName}-ecs-service-role-{Environment}`

**Note**: AWS provides a managed service role `AWSServiceRoleForECS` that can be used instead.

---

### 4. CodeBuild Service Role

**Purpose**: Allows CodeBuild to build images, push to ECR, and deploy to ECS.

**Required Permissions**:
- `ecr:GetAuthorizationToken`
- `ecr:BatchCheckLayerAvailability`
- `ecr:GetDownloadUrlForLayer`
- `ecr:BatchGetImage`
- `ecr:PutImage`
- `ecr:InitiateLayerUpload`
- `ecr:UploadLayerPart`
- `ecr:CompleteLayerUpload`
- `ecs:RegisterTaskDefinition`
- `ecs:DescribeTaskDefinition`
- `ecs:UpdateService`
- `ecs:DescribeServices`
- `logs:CreateLogGroup`
- `logs:CreateLogStream`
- `logs:PutLogEvents`
- `s3:GetObject`
- `s3:PutObject`

**Trust Policy**:
```json
{
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
}
```

**Role Name Pattern**: `{ProjectName}-codebuild-role-{Environment}`

---

### 5. CodePipeline Service Role

**Purpose**: Allows CodePipeline to orchestrate builds and deployments.

**Required Permissions**:
- `codebuild:BatchGetBuilds`
- `codebuild:StartBuild`
- `codedeploy:CreateDeployment`
- `codedeploy:GetApplication`
- `codedeploy:GetApplicationRevision`
- `codedeploy:GetDeployment`
- `codedeploy:GetDeploymentConfig`
- `codedeploy:RegisterApplicationRevision`
- `ecs:DescribeServices`
- `ecs:DescribeTaskDefinition`
- `ecs:DescribeTasks`
- `ecs:ListTasks`
- `ecs:RegisterTaskDefinition`
- `ecs:UpdateService`
- `iam:PassRole` (for CodeBuild and CodeDeploy roles)
- `s3:GetObject`
- `s3:GetObjectVersion`
- `s3:PutObject`
- `s3:GetBucketVersioning`
- `s3:PutBucketVersioning`

**Trust Policy**:
```json
{
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
}
```

**Role Name Pattern**: `{ProjectName}-codepipeline-role-{Environment}`

---

### 6. ECS Exec Role (Optional)

**Purpose**: Allows ECS Exec to connect to running containers for debugging.

**Required Permissions**:
- `ssmmessages:CreateControlChannel`
- `ssmmessages:CreateDataChannel`
- `ssmmessages:OpenControlChannel`
- `ssmmessages:OpenDataChannel`

**Trust Policy**:
```json
{
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
}
```

**Role Name Pattern**: `{ProjectName}-ecs-exec-role-{Environment}`

**Note**: These permissions can be added to the Task Execution Role instead of creating a separate role.

---

## Service-Linked Roles

### ECS Service-Linked Role

**Purpose**: Allows ECS to manage resources on your behalf.

**Creation**: Automatically created by AWS when first ECS service is created, or manually:

```bash
aws iam create-service-linked-role \
  --aws-service-name ecs.amazonaws.com
```

**ARN Pattern**: `arn:aws:iam::{AccountId}:role/aws-service-role/ecs.amazonaws.com/AWSServiceRoleForECS`

---

## Cross-Account Permissions (If Needed)

If deploying across multiple AWS accounts:

1. **ECR Cross-Account Access**:
   - Repository policy allowing cross-account pull
   - IAM role in target account with ECR permissions

2. **CloudWatch Cross-Account Logging**:
   - Resource policy on CloudWatch Logs
   - IAM role with logs:PutLogEvents permission

---

## IAM Policy Examples

### ECS Task Execution Role Policy (Managed Policy Alternative)

AWS provides managed policy: `AmazonECSTaskExecutionRolePolicy`

You can also create a custom policy with additional permissions:

```json
{
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
    }
  ]
}
```

---

## Validation

After creating IAM roles, validate:

```bash
# Check if roles exist
aws iam get-role --role-name {ProjectName}-ecs-task-execution-role-{Environment}
aws iam get-role --role-name {ProjectName}-ecs-task-role-{Environment}
aws iam get-role --role-name {ProjectName}-ecs-service-role-{Environment}

# Check trust policies
aws iam get-role --role-name {RoleName} --query 'Role.AssumeRolePolicyDocument'

# Check attached policies
aws iam list-attached-role-policies --role-name {RoleName}
aws iam list-role-policies --role-name {RoleName}
```

---

## Security Best Practices

1. **Principle of Least Privilege**: Only grant minimum required permissions
2. **Use Managed Policies**: Prefer AWS managed policies when possible
3. **Separate Roles**: Use separate roles for task execution and task runtime
4. **Regular Audits**: Review IAM roles and policies regularly
5. **Resource-Specific Policies**: Use resource-based policies (e.g., ECR repository policies) when possible
6. **Enable CloudTrail**: Monitor IAM role usage
7. **Rotate Credentials**: Regularly rotate access keys (if using)

---

## Next Steps

After creating IAM prerequisites:

1. Verify all roles exist and have correct permissions
2. Test role assumptions
3. Proceed with infrastructure provisioning (Use Case 1)
4. Reference these roles in your infrastructure code

---

## Related Documentation

- [AWS ECS Task Execution Role](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_execution_IAM_role.html)
- [AWS ECS Task Role](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

