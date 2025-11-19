# ECS Deployment Use Cases (Augmented)

> **Document Status**: This is an augmented version that incorporates validation against AWS best practices, enhanced ECR integration, missing use cases, and improved technical depth based on the reasoning in `context.md`.

## Actors

- **Development Team**: Authors code, builds images, maintains CI/CD pipeline code
- **CI/CD Pipeline**: Automated deployment system (CodePipeline, CodeBuild, ECS Deploy)
- **Operations Team**: Manages production runtime, monitors deployments, handles exceptions
- **Infrastructure Team**: Provisions infrastructure, manages clusters, provides foundation
- **Security Team**: Approves security scanning setup, manages security policies
- **Vulnerability Management Team**: Reviews scan results, manages CVEs, coordinates remediation

---

## Use Case 1: Infrastructure Provisioning (CaI)

```
┌─────────────┐
│Development  │
└──────┬──────┘
       │ 1. Requests infrastructure
       │    (cluster, networking, IAM)
       ▼
┌─────────────┐
│Infrastructure│
└──────┬──────┘
       │ 2. Provisions ECS cluster
       │ 3. Creates VPC and subnets
       │ 4. Sets up security groups
       │ 5. Creates IAM roles
       │    (task execution, task role)
       │ 6. Configures CloudWatch Logs
       │ 7. Enables Container Insights
       │ 8. Sets up service discovery
       │ 9. Provisions load balancer
       │ 10. Configures capacity providers
       │ 11. Sets up auto-scaling policies
       ▼
┌─────────────┐
│ Operations  │
└──────┬──────┘
       │ 12. Validates infrastructure
       │ 13. Tests connectivity
       │ 14. Configures monitoring
       │ 15. Validates high availability
       │ 16. Validates Container Insights
```

**Responsibilities**:
- **Development**: Requests infrastructure needs, provides requirements
- **Infrastructure**: Provisions all foundational infrastructure, creates all artifacts
- **Operations**: Validates infrastructure, tests connectivity, configures monitoring
- **CI/CD**: (Not involved - infrastructure setup)

**Artifacts by Stage**:

**Stage 1 - Development Requests**:
- Infrastructure requirements document
- Service specifications (ports, protocols)
- IAM permission requirements
- High availability requirements
- Multi-AZ requirements

**Stage 2 - ECS Cluster**:
- CloudFormation/CDK: `ecs-cluster.yaml` / `ecs-cluster.ts`
- Cluster ARN: `arn:aws:ecs:region:account:cluster/cluster-name`
- Cluster configuration JSON
- Cluster tags (Environment, Project, CostCenter)
- Cluster capacity providers configuration

**Stage 3 - VPC and Subnets**:
- CloudFormation/CDK: `vpc.yaml` / `vpc.ts`
- VPC ID: `vpc-xxxxxxxxx`
- Subnet IDs: `subnet-xxxxx`, `subnet-yyyyy` (public and private)
- Route table configurations
- Internet Gateway / NAT Gateway
- VPC endpoints for ECR, S3, CloudWatch Logs (for private subnets)
- Multi-AZ subnet distribution

**Stage 4 - Security Groups**:
- CloudFormation/CDK: `security-groups.yaml` / `security-groups.ts`
- Security Group ID: `sg-xxxxxxxxx`
- Security group rules (ingress/egress)
- Security group tags
- Security group for ECR access (if using VPC endpoints)

**Stage 5 - IAM Roles**:
- CloudFormation/CDK: `iam-roles.yaml` / `iam-roles.ts`
- Task Execution Role ARN: `arn:aws:iam::account:role/ecsTaskExecutionRole`
  - ECR pull permissions
  - CloudWatch Logs write permissions
  - Secrets Manager/Parameter Store read permissions
  - KMS decrypt permissions (for encrypted logs/secrets)
- Task Role ARN: `arn:aws:iam::account:role/ecsTaskRole`
  - Application-specific permissions
- IAM role policies (JSON)
- Trust policies
- IAM role tags

**Stage 6 - CloudWatch Logs**:
- CloudFormation/CDK: `cloudwatch-logs.yaml` / `cloudwatch-logs.ts`
- Log Group: `/ecs/cluster-name`
- Log retention policy (7, 14, 30, 60, 90, 120, 150, 180, 365 days, or Never)
- Log encryption settings (KMS key)
- Log group tags
- Log subscription filters (for log aggregation/analysis)

**Stage 7 - Container Insights**:
- Container Insights enabled as cluster setting (not separate infrastructure)
- AWS CLI command: `aws ecs update-cluster-settings --cluster cluster-name --settings name=containerInsights,value=enabled`
- CloudFormation/CDK: Cluster setting in `ecs-cluster.yaml` / `ecs-cluster.ts`:
  ```yaml
  ClusterSettings:
    - Name: containerInsights
      Value: enabled
  ```
- CloudWatch Logs group for Container Insights: `/aws/ecs/containerinsights/cluster-name/performance`
- Container Insights metrics namespace: `ECS/ContainerInsights`
- Performance metrics collection enabled
- Container Insights dashboard configuration
- IAM permissions for Container Insights (CloudWatch Logs, CloudWatch Metrics)

**Stage 8 - Service Discovery**:
- CloudFormation/CDK: `service-discovery.yaml` / `service-discovery.ts`
- Cloud Map namespace ID
- Service discovery configuration
- DNS namespace configuration
- Service discovery health checks

**Stage 9 - Load Balancer**:
- CloudFormation/CDK: `load-balancer.yaml` / `load-balancer.ts`
- Load Balancer ARN: `arn:aws:elasticloadbalancing:region:account:loadbalancer/...`
- Target Group ARN: `arn:aws:elasticloadbalancing:region:account:targetgroup/...`
- Listener configurations
- SSL/TLS certificates (ACM)
- Health check configuration
- Sticky session configuration (if needed)
- WAF integration (if applicable)

**Stage 10 - Capacity Providers**:
- CloudFormation/CDK: `capacity-providers.yaml` / `capacity-providers.ts`
- Capacity provider configuration
- Auto Scaling group (if EC2 launch type)
- Fargate capacity provider settings
- Spot capacity provider (if using Spot instances)
- Capacity provider strategy (Fargate, EC2, Spot mix)

**Stage 11 - Auto-Scaling Policies**:
- CloudFormation/CDK: `auto-scaling.yaml` / `auto-scaling.ts`
- Target tracking scaling policies
- Step scaling policies
- Scheduled scaling policies
- CloudWatch alarms for scaling triggers
- Scaling cooldown periods

**Stage 12 - Infrastructure Validation**:
- Validation script/test results
- Infrastructure validation report
- Connectivity test results
- Multi-AZ validation
- High availability validation

**Stage 13 - Connectivity Testing**:
- Network connectivity test results
- Security group test results
- Load balancer health check results
- ECR connectivity test (from private subnets)
- Service discovery DNS resolution tests

**Stage 14 - Monitoring Configuration**:
- CloudWatch dashboard configuration
- CloudWatch alarms configuration
- Monitoring runbook
- Alert notification setup (SNS topics)
- X-Ray tracing configuration (if applicable)
- Custom metrics configuration

**Stage 15 - High Availability Validation**:
- Multi-AZ task distribution validation
- Load balancer multi-AZ validation
- Failover testing results
- Disaster recovery readiness assessment

**Stage 16 - Container Insights Validation**:
- Container Insights metrics collection verified
- Container Insights dashboard accessible
- Performance metrics visible (CPU, memory, network)
- Log group for Container Insights created
- IAM permissions validated

---

## Use Case 2: ECR Repository Setup (CaI) - Enhanced

```
┌─────────────┐
│Development  │
└──────┬──────┘
       │ 1. Requests ECR repository
       │ 2. Specifies requirements
       │    (scanning, lifecycle, policies)
       │ 3. Defines image tagging strategy
       ▼
┌─────────────┐
│Infrastructure│
└──────┬──────┘
       │ 4. Creates ECR repository
       │ 5. Configures image scanning
       │ 6. Sets lifecycle policies
       │ 7. Configures repository policies
       │ 8. Sets up cross-account access (if needed)
       │ 9. Configures cross-region replication (if needed)
       │ 10. Sets up image signing (if required)
       │ 11. Provides repository URI
       ▼
┌─────────────┐
│ Development │
└──────┬──────┘
       │ 12. Configures CI/CD to use repository
       │ 13. Tests image push/pull
       ▼
┌─────────────┐
│  Security   │
└──────┬──────┘
       │ 14. Validates security configuration
       │ 15. Reviews scanning policies
```

**Responsibilities**:
- **Development**: Requests repository, defines tagging strategy, configures CI/CD
- **Infrastructure**: Provisions and configures ECR with all policies
- **Security**: Validates security configuration, reviews scanning policies
- **Operations**: (No direct involvement)

**Artifacts by Stage**:

**Stage 1-3 - Development Requests**:
- ECR repository requirements document
- Image scanning requirements (scanOnPush, continuous scanning)
- Lifecycle policy requirements
- Repository policy requirements
- Cross-account access requirements (if needed)
- Cross-region replication requirements (if needed)
- Image tagging strategy:
  - Semantic versioning: `v1.2.3`
  - Git SHA: `sha-abc123`
  - Environment tags: `dev`, `staging`, `prod`
  - Build number: `build-123`
  - Combined: `v1.2.3-sha-abc123`
- Image retention requirements
- Image signing requirements (if compliance needed)

**Stage 4 - ECR Repository Creation**:
- CloudFormation/CDK: `ecr-repository.yaml` / `ecr-repository.ts`
- ECR Repository URI: `account-id.dkr.ecr.region.amazonaws.com/repo-name`
- Repository ARN: `arn:aws:ecr:region:account:repository/repo-name`
- Repository encryption configuration (KMS key)
- Repository tags (Environment, Project, CostCenter)

**Stage 5 - Image Scanning Configuration**:
- Image scanning configuration (scanOnPush: true)
- Continuous scanning configuration
- Scanning policy JSON
- Scanning notification configuration (SNS topic)
- Scanning severity thresholds (CRITICAL, HIGH, MEDIUM, LOW)

**Stage 6 - Lifecycle Policies**:
- Lifecycle policy JSON
- Image retention rules:
  - Untagged images: retention period (e.g., 7 days)
  - Tagged images: retention by count (e.g., keep last 10)
  - Age-based retention (e.g., delete images older than 90 days)
- Cost optimization: delete old images to reduce storage costs

**Stage 7 - Repository Policies**:
- Repository policy JSON
- Cross-account access policies (if configured)
- Pull/push permissions
- IAM principal permissions

**Stage 8 - Cross-Account Access**:
- Repository policy with cross-account permissions
- IAM role policies for cross-account access
- Cross-account access documentation

**Stage 9 - Cross-Region Replication**:
- Replication configuration
- Destination region repositories
- Replication rules
- Replication status monitoring

**Stage 10 - Image Signing**:
- Image signing configuration (if required for compliance)
- Signing key management
- Signature verification policies

**Stage 11 - Repository URI**:
- Repository URI provided to Development
- Docker login credentials
- ECR authentication token (temporary, expires in 12 hours)
- IAM role for ECR access (for CI/CD)

**Stage 12 - CI/CD Configuration**:
- buildspec.yaml updated with ECR repository URI
- CodeBuild environment variables (ECR repository)
- Pipeline configuration updated
- ECR authentication in build process
- Image tagging automation in CI/CD

**Stage 13 - Image Push/Pull Testing**:
- Test image push from CI/CD
- Test image pull by ECS task
- Authentication validation
- Tagging strategy validation

**Stage 14-15 - Security Validation**:
- Security configuration review
- Scanning policy validation
- Access control validation
- Compliance check (if applicable)

---

## Use Case 3: CI/CD Infrastructure Setup (CaI) - Enhanced

```
┌─────────────┐
│Development  │
└──────┬──────┘
       │ 1. Authors pipeline code (CDK/CloudFormation)
       │ 2. Defines build and deploy stages
       │ 3. Commits pipeline infrastructure code
       │ 4. Defines ECR integration
       ▼
┌─────────────┐
│Infrastructure│
└──────┬──────┘
       │ 5. Provisions CodeStar Connection
       │ 6. Creates base IAM roles for CI/CD
       │ 7. Sets up S3 bucket for artifacts
       │ 8. Configures CodeBuild base permissions
       │ 9. Configures ECR access for CodeBuild
       │ 10. Sets up secrets for external tools
       │ 11. Deploys pipeline infrastructure
       ▼
┌─────────────┐
│   CI/CD     │
└──────┬──────┘
       │ 12. Pipeline infrastructure ready
       │ 13. Ready for application deployments
       │ 14. ECR integration validated
```

**Responsibilities**:
- **Development**: Authors pipeline code, defines stages, ECR integration
- **Infrastructure**: Provisions CI/CD infrastructure, base IAM roles, ECR access
- **Operations**: (No direct involvement in setup)
- **CI/CD**: (Infrastructure becomes operational)

**Artifacts by Stage**:

**Stage 1-2 - Pipeline Code**:
- CloudFormation/CDK: `pipeline.yaml` / `pipeline.ts`
- Pipeline definition JSON/YAML
- Build stage configuration
- Deploy stage configuration
- buildspec.yaml files
- ECR integration in buildspec:
  - ECR login
  - Docker build with multi-stage optimization
  - Image tagging (git SHA, semantic version, build number)
  - Image push to ECR
  - Image scanning integration

**Stage 3 - Pipeline Code Committed**:
- Git repository with pipeline infrastructure code
- Pipeline code in version control
- Code review completed

**Stage 4 - ECR Integration Definition**:
- ECR repository references in pipeline
- Image tagging strategy in pipeline
- Image scanning integration
- Image promotion strategy (dev → staging → prod)

**Stage 5 - CodeStar Connection**:
- CloudFormation/CDK: `codestar-connection.yaml` / `codestar-connection.ts`
- CodeStar Connection ARN: `arn:aws:codestar-connections:region:account:connection/id`
- GitHub OAuth/App authentication setup
- Connection status validation

**Stage 6 - Base IAM Roles**:
- CloudFormation/CDK: `cicd-iam-roles.yaml` / `cicd-iam-roles.ts`
- CodePipeline service role ARN
- CodeBuild service role ARN
- ECS Deploy action role ARN
- ECR access permissions:
  - ECR:GetAuthorizationToken
  - ECR:BatchCheckLayerAvailability
  - ECR:GetDownloadUrlForLayer
  - ECR:BatchGetImage
  - ECR:PutImage
  - ECR:InitiateLayerUpload
  - ECR:UploadLayerPart
  - ECR:CompleteLayerUpload

**Stage 7 - S3 Artifacts Bucket**:
- CloudFormation/CDK: `artifacts-bucket.yaml` / `artifacts-bucket.ts`
- S3 bucket ARN: `arn:aws:s3:::pipeline-artifacts-bucket`
- S3 bucket policy
- Encryption configuration (SSE-S3 or SSE-KMS)
- Lifecycle policies for artifact retention
- Versioning enabled

**Stage 8 - CodeBuild Permissions**:
- CodeBuild project IAM role
- VPC configuration (if needed for private builds)
- Environment variables (non-sensitive)
- Build environment image configuration
- Build timeout and compute configuration
- Build caching configuration (for faster builds)

**Stage 9 - ECR Access for CodeBuild**:
- CodeBuild IAM role with ECR permissions
- ECR authentication in buildspec
- Image layer caching strategy
- Build optimization for ECR push

**Stage 10 - Secrets Setup**:
- Secrets Manager secrets for external tools (Rapid7, etc.)
- IAM permissions for CodeBuild to access secrets
- Secret rotation policies (if applicable)

**Stage 11 - Pipeline Infrastructure Deployed**:
- CodePipeline ARN: `arn:aws:codepipeline:region:account:pipeline/name`
- CodeBuild project ARN: `arn:aws:codebuild:region:account:project/name`
- Pipeline execution history
- Pipeline status dashboard

**Stage 12-14 - Pipeline Ready**:
- Pipeline infrastructure operational
- Ready to trigger on code commits
- Ready for application deployments
- ECR integration validated
- Test pipeline execution successful

---

## Use Case 4: Security Approval for API Scanning (CaI)

*(Same as original - already comprehensive)*

---

## Use Case 5: Security Approval for Cloud Scanning (CaI)

*(Same as original - already comprehensive)*

---

## Use Case 6: Normal Deployment (CI/CD) - Enhanced

```
┌─────────────┐
│ Development │
└──────┬──────┘
       │ 1. Commits code
       │ 2. Pushes to GitHub
       │ 3. Creates PR (optional)
       ▼
┌─────────────┐
│   CI/CD     │
└──────┬──────┘
       │ 4. Triggers on commit/merge
       │ 5. Builds Docker image
       │ 6. Runs unit tests
       │ 7. Scans image (ECR + Rapid7)
       │ 8. Tags image (git SHA, semantic version)
       │ 9. Pushes to ECR
       │ 10. Registers task definition
       │ 11. Deploys to Dev
       │ 12. Runs integration tests
       │ 13. Deploys to Staging
       │ 14. Runs smoke tests
       ▼
┌─────────────┐
│ Operations  │
└──────┬──────┘
       │ 15. Reviews staging
       │ 16. Validates monitoring
       │ 17. Approves production
       ▼
┌─────────────┐
│   CI/CD     │
└──────┬──────┘
       │ 18. Deploys to Production
       │ 19. Validates deployment
       ▼
┌─────────────┐
│ Operations  │
└─────────────┘
       │ 20. Monitors service health
       │ 21. Validates deployment
       │ 22. Documents deployment
```

**Responsibilities**:
- **Development**: Commits code, maintains pipeline, fixes issues
- **CI/CD**: Builds, tests, scans, deploys automatically
- **Operations**: Reviews, approves, monitors, validates
- **Infrastructure**: (No direct involvement - infrastructure already provisioned)

**Artifacts by Stage**:

**Stage 1-2 - Code Commit**:
- Application source code (Git)
- Task definition files (Git)
- Dockerfile (Git)
- buildspec.yaml (Git)
- Git commit SHA
- Git branch/tag
- Code review completed (if PR workflow)

**Stage 3 - PR Creation (Optional)**:
- Pull request created
- Code review process
- Automated tests in PR
- PR approval

**Stage 4 - Pipeline Trigger**:
- CodePipeline execution triggered
- Pipeline execution ID
- Source stage artifacts

**Stage 5 - Image Build**:
- Docker image built (multi-stage if optimized)
- Image tagged with commit SHA: `repo:sha-abc123`
- Build logs
- CodeBuild build ID
- Build cache utilized (if configured)
- Build time metrics

**Stage 6 - Unit Tests**:
- Unit test results
- Test coverage report
- Test pass/fail status
- Test execution logs

**Stage 7 - Image Scan**:
- ECR image scan results (AWS native)
- Rapid7 API scan results (if configured)
- Vulnerability report
- Scan status (pass/fail)
- CVE list with severity
- Scan blocking policy (fail pipeline on CRITICAL/HIGH)

**Stage 8 - Image Tagging**:
- Multiple tags applied:
  - Git SHA: `sha-abc123`
  - Semantic version: `v1.2.3` (if applicable)
  - Environment tag: `dev`, `staging`, `prod`
  - Latest tag: `latest` (for dev only)
- Tag metadata stored

**Stage 9 - ECR Push**:
- Image pushed to ECR: `account-id.dkr.ecr.region.amazonaws.com/repo:sha-abc123`
- Image digest: `sha256:abc123...`
- Image metadata
- ECR push logs
- Image size and layer information
- Push time metrics

**Stage 10 - Task Definition Registration**:
- Task definition JSON/YAML updated with new image URI
- Task definition ARN: `arn:aws:ecs:region:account:task-definition/family:revision`
- Task definition revision number
- Registered task definition in ECS
- Task definition validation
- Resource requirements validated (CPU, memory)
- Health check configuration (JSON format):
  - `command`: Health check command or HTTP endpoint
  - `interval`: 30 seconds (default, configurable)
  - `timeout`: 5 seconds (default, configurable)
  - `retries`: 3 (default, configurable)
  - `startPeriod`: 0-300 seconds (grace period for container startup, camelCase in JSON)

**Stage 11 - Dev Deployment**:
- ECS service updated in dev
- Service deployment ID
- Deployment status
- Service ARN: `arn:aws:ecs:region:account:service/cluster/service`
- Task startup logs
- Health check results
- Deployment time metrics

**Stage 12 - Integration Tests**:
- Integration test execution
- Test results
- API endpoint validation
- Database connectivity tests
- External service integration tests

**Stage 13 - Staging Deployment**:
- ECS service updated in staging
- Service deployment ID
- Deployment status
- Service ARN
- imagedefinitions.json
- Staging environment validation

**Stage 14 - Smoke Tests**:
- Smoke test execution
- Critical path validation
- Performance baseline check
- Smoke test results

**Stage 15 - Staging Review**:
- Staging deployment review notes
- Test results review
- Validation checklist
- Performance metrics review
- Error rate validation

**Stage 16 - Monitoring Validation**:
- CloudWatch metrics validation
- Alert configuration check
- Dashboard updates
- Log aggregation validation

**Stage 17 - Production Approval**:
- Manual approval action in pipeline
- Approval timestamp
- Approver identity
- Approval justification

**Stage 18 - Production Deployment**:
- ECS service updated in production
- Service deployment ID
- Deployment status
- Service ARN
- imagedefinitions.json
- Production deployment configuration
- Deployment circuit breaker enabled:
  - Enable: `true`
  - Rollback: `true` (automatic rollback on deployment failure)
  - Note: Circuit breaker triggers based on service health check failures during deployment, automatically rolling back if deployment fails
- Blue/green or rolling deployment strategy applied

**Stage 19 - Deployment Validation**:
- Deployment health check
- Service health validation
- Task health validation
- Load balancer target health
- Initial metrics validation

**Stage 20-21 - Production Monitoring**:
- CloudWatch metrics
- Service health status
- Deployment validation results
- Monitoring dashboard updates
- Error rate monitoring
- Performance metrics
- Cost impact assessment

**Stage 22 - Documentation**:
- Deployment record
- Deployment version
- Deployment timestamp
- Deployment artifacts
- Rollback plan documented

---

## Use Case 7: Emergency Hotfix (Manual) - Enhanced

```
┌─────────────┐
│ Operations  │
└──────┬──────┘
       │ 1. Identifies production issue
       │ 2. Escalates to Development
       ▼
┌─────────────┐
│ Development │
└──────┬──────┘
       │ 3. Creates hotfix branch
       │ 4. Implements fix
       │ 5. Builds image manually (or via CI/CD)
       │ 6. Tags image: repo:hotfix-YYYYMMDD-HHMM
       │ 7. Scans image (quick scan)
       │ 8. Pushes to ECR
       ▼
┌─────────────┐
│ Operations  │
└──────┬──────┘
       │ 9. Manually updates task definition
       │ 10. Manually deploys service
       │ 11. Monitors deployment
       │ 12. Validates fix
       │ 13. Documents manual deployment
       │ 14. Creates incident report
       ▼
┌─────────────┐
│   CI/CD     │
└─────────────┘
       │ 15. Later: Hotfix merged to main
       │ 16. Normal pipeline catches up
       │ 17. Production re-deployed via CI/CD
```

**Responsibilities**:
- **Operations**: Identifies issue, executes manual deployment, monitors, documents
- **Development**: Creates fix, builds image (or triggers CI/CD)
- **CI/CD**: (Bypassed for speed, catches up later)
- **Infrastructure**: (No direct involvement)

**Artifacts by Stage**:

**Stage 1 - Issue Identification**:
- Incident report
- Error logs
- CloudWatch alarms triggered
- Service health metrics showing issues
- User impact assessment

**Stage 2 - Escalation**:
- Escalation ticket
- Issue description
- Severity level (P0, P1, P2)
- On-call notification

**Stage 3 - Hotfix Branch**:
- Hotfix branch created: `hotfix/issue-description`
- Branch from production tag or main
- Git branch reference

**Stage 4 - Fix Implementation**:
- Hotfix code changes
- Fix commit SHA
- Code review (expedited if possible)
- Fix validation (local testing)

**Stage 5 - Manual Image Build**:
- Docker image built (locally or via CI/CD trigger)
- Image tagged: `repo:hotfix-20240115-1430`
- Build logs
- Build time (should be fast)

**Stage 6 - Image Tagging**:
- Hotfix-specific tag applied
- Git SHA tag also applied
- Tag format: `hotfix-YYYYMMDD-HHMM` for traceability

**Stage 7 - Quick Image Scan**:
- ECR scan executed (may skip Rapid7 for speed)
- Critical vulnerability check only
- Scan results (abbreviated)
- Risk assessment (proceed if only LOW/MEDIUM)

**Stage 8 - ECR Push**:
- Image pushed to ECR: `account-id.dkr.ecr.region.amazonaws.com/repo:hotfix-20240115-1430`
- Image digest
- ECR push confirmation
- Push time metrics

**Stage 9 - Manual Task Definition Update**:
- Task definition updated with new image URI
- Task definition ARN: `arn:aws:ecs:region:account:task-definition/family:revision`
- Previous task definition version noted (for rollback)
- Task definition validation

**Stage 10 - Manual Service Deployment**:
- AWS CLI command executed: `aws ecs update-service --cluster cluster-name --service service-name --task-definition family:revision`
- Service update initiated
- Service deployment ID
- Service update status

**Stage 11 - Deployment Monitoring**:
- Service deployment status monitored closely
- Task status
- CloudWatch metrics
- Service health checks
- Error rate monitoring
- Real-time alerting

**Stage 12 - Fix Validation**:
- Application functionality test results
- Service health validation
- Fix verification
- Issue resolution confirmation
- User impact resolution

**Stage 13 - Documentation**:
- Manual deployment log entry
- Deployment reason documented
- Task definition version recorded
- Deployment timestamp
- Hotfix procedure followed

**Stage 14 - Incident Report**:
- Incident report created
- Root cause analysis (to be completed)
- Timeline of events
- Resolution steps
- Post-mortem scheduled

**Stage 15-17 - CI/CD Catch-up**:
- Hotfix merged to main branch
- Normal CI/CD pipeline executes
- Pipeline catches up with manual deployment
- Production re-deployed via CI/CD (optional, for consistency)
- Normal deployment process restored

---

## Use Case 8: Rollback - Enhanced

```
┌─────────────┐
│ Operations  │
└──────┬──────┘
       │ 1. Detects deployment issue
       │ 2. Validates issue severity
       │ 3. Identifies previous task definition
       │ 4. Identifies previous ECR image
       │ 5. Executes rollback
       │ 6. Monitors rollback
       │ 7. Validates rollback success
       │ 8. Notifies Development
       │ 9. Documents rollback
       ▼
┌─────────────┐
│ Development │
└──────┬──────┘
       │ 10. Analyzes root cause
       │ 11. Fixes issue
       │ 12. Uses CI/CD for next deployment
       │ 13. Implements prevention measures
```

**Responsibilities**:
- **Operations**: Executes rollback, monitors, coordinates, documents
- **Development**: Analyzes issue, fixes, redeploys via CI/CD
- **CI/CD**: (Not used for rollback, used for fix)
- **Infrastructure**: (No direct involvement)

**Artifacts by Stage**:

**Stage 1 - Issue Detection**:
- Incident report
- Error logs
- CloudWatch alarms triggered
- Service health metrics showing issues
- User impact assessment
- Error rate spike
- Performance degradation

**Stage 2 - Severity Validation**:
- Severity assessment (P0, P1, P2)
- Impact analysis
- Rollback decision (automatic vs. manual)
- Rollback approval (if manual)

**Stage 3 - Previous Task Definition Identification**:
- Previous task definition ARN: `arn:aws:ecs:region:account:task-definition/family:previous-revision`
- Task definition history reviewed
- Known-good version identified
- Task definition metadata (deployment time, version)

**Stage 4 - Previous ECR Image Identification**:
- Previous ECR image tag identified
- ECR image digest: `sha256:previous-abc123...`
- Image metadata reviewed
- Image scan results for previous version (if available)
- Image availability confirmed

**Stage 5 - Rollback Execution**:
- AWS CLI command: `aws ecs update-service --cluster cluster-name --service service-name --task-definition family:previous-revision`
- Service update initiated
- Rollback deployment ID
- Service deployment status
- Rollback strategy (immediate vs. gradual)

**Stage 6 - Rollback Monitoring**:
- Service deployment status monitored closely
- Task status during rollback
- CloudWatch metrics
- Service health recovery validation
- Error rate reduction monitoring
- Performance recovery validation

**Stage 7 - Rollback Validation**:
- Service health restored
- Error rate normalized
- Performance metrics restored
- User impact resolved
- Rollback success confirmed

**Stage 8 - Development Notification**:
- Incident notification sent
- Rollback details communicated
- Issue description
- Previous version information
- Current version information
- Timeline of events

**Stage 9 - Rollback Documentation**:
- Rollback log entry
- Rollback reason documented
- Task definition versions (from → to)
- ECR image versions (from → to)
- Rollback timestamp
- Rollback duration
- Impact assessment

**Stage 10 - Root Cause Analysis**:
- Issue root cause identified
- Analysis document
- Contributing factors
- Timeline of failure

**Stage 11 - Issue Fix**:
- Fix code changes (Git)
- Fix commit SHA
- Updated task definition
- Fix validation (testing)

**Stage 12 - CI/CD Redeployment**:
- Normal CI/CD pipeline execution
- New deployment with fix
- Deployment validation
- Fix verification

**Stage 13 - Prevention Measures**:
- Prevention measures implemented
- Process improvements
- Additional testing added
- Monitoring improvements
- Documentation updates

---

## Use Case 9: Configuration Change - Enhanced

```
┌─────────────┐
│ Operations  │
└──────┬──────┘
       │ 1. Identifies configuration need
       │ 2. Reviews current configuration
       │ 3. Updates service configuration
       │    (desired count, deployment settings)
       │ 4. Validates configuration change
       │ 5. Monitors scaling/change
       │ 6. Validates new configuration
       │ 7. Documents configuration change
```

**Responsibilities**:
- **Operations**: Executes config change, monitors, validates, documents
- **Development**: (No involvement - no code change)
- **CI/CD**: (Not used - configuration only)
- **Infrastructure**: (No direct involvement)

**Artifacts by Stage**:

**Stage 1 - Configuration Need Identification**:
- Configuration change request
- Business justification
- Performance requirements
- Capacity requirements
- Cost considerations

**Stage 2 - Current Configuration Review**:
- Current service configuration
- Current desired count
- Current deployment configuration
- Current resource allocation
- Current performance metrics
- Cost baseline

**Stage 3 - Service Configuration Update**:
- AWS CLI command: `aws ecs update-service --cluster cluster-name --service service-name --desired-count X --deployment-configuration maximumPercent=200,minimumHealthyPercent=100`
- Updated service configuration
- Service ARN: `arn:aws:ecs:region:account:service/cluster/service`
- Configuration change parameters:
  - Desired count (scaling up/down)
  - Deployment configuration:
    - maximumPercent (e.g., 200%)
    - minimumHealthyPercent (e.g., 100%)
  - Placement constraints
  - Placement strategy
  - Capacity provider strategy
  - Network configuration (if changing)
  - Load balancer configuration (if changing)

**Stage 4 - Configuration Validation**:
- Configuration change validated
- Resource availability checked
- Quota limits checked
- Cost impact assessed
- Change approved (if required)

**Stage 5 - Scaling/Change Monitoring**:
- Service scaling status
- Task count changes
- CloudWatch metrics (CPU, memory, task count)
- Scaling event logs
- Task startup/shutdown events
- Load balancer target registration
- Health check status

**Stage 6 - Configuration Validation**:
- New configuration validated
- Service health checks
- Task distribution validation
- Configuration change confirmation
- Performance metrics validated
- Cost impact validated

**Stage 7 - Documentation**:
- Configuration change log
- Before/after configuration
- Change timestamp
- Change reason
- Change impact
- Rollback procedure (if needed)

---

## Use Case 10: Additional Infrastructure Request - Enhanced

*(Same structure as original, but with enhanced artifacts)*

---

## Use Case 11: Blue/Green Deployment - Enhanced

```
┌─────────────┐
│ Operations  │
└──────┬──────┘
       │ 1. Reviews new version
       │ 2. Creates green service
       │ 3. Configures green target group
       │ 4. Tests green independently
       │ 5. Validates green service
       │ 6. Switches traffic to green (gradual or immediate)
       │ 7. Monitors green service
       │ 8. Validates production traffic
       │ 9. Terminates blue service
       │ 10. Cleans up blue resources
       │ 11. Documents blue/green deployment
```

**Responsibilities**:
- **Operations**: Manages blue/green process, traffic switching, monitoring
- **Development**: (Provides new version via CI/CD)
- **CI/CD**: (May build image, but Operations manages deployment)
- **Infrastructure**: (Infrastructure already exists)

**Artifacts by Stage**:

**Stage 1 - New Version Review**:
- New task definition version
- New ECR image tag
- Change log review
- Risk assessment

**Stage 2 - Green Service Creation**:
- New ECS service created: `service-name-green`
- Service ARN: `arn:aws:ecs:region:account:service/cluster/service-green`
- Task definition: new version
- Service configuration
- Service tags (Environment: green)

**Stage 3 - Green Target Group Configuration**:
- New target group for green service
- Target group ARN
- Health check configuration
- Traffic routing rules
- Load balancer listener rules (for gradual traffic shift)

**Stage 4 - Green Service Testing**:
- Green service health checks
- Application functionality tests
- Performance tests
- Integration tests
- Test results and validation
- Green service isolated from production traffic

**Stage 5 - Green Service Validation**:
- Service health validated
- Application functionality validated
- Performance baseline established
- Error rate validated
- Ready for traffic switch

**Stage 6 - Traffic Switch**:
- Load balancer target group updated
- Traffic routing switched to green (immediate or gradual)
- Blue service traffic reduced/stopped
- Traffic switch confirmation
- Traffic shift monitoring (if gradual)

**Stage 7 - Green Service Monitoring**:
- Green service metrics
- Application health status
- Error rates
- Performance metrics
- User experience metrics
- Real-time alerting

**Stage 8 - Production Traffic Validation**:
- Production traffic handling validated
- User experience validated
- Performance validated
- Error rate acceptable
- Business metrics validated

**Stage 9 - Blue Service Termination**:
- Blue service deleted: `aws ecs delete-service --cluster cluster-name --service service-blue`
- Blue service cleanup
- Resource cleanup confirmation
- Blue target group removed (if separate)

**Stage 10 - Resource Cleanup**:
- Blue service resources cleaned up
- Blue target group cleaned up (if applicable)
- Old task definitions archived (optional)
- Old ECR images retained (per lifecycle policy)

**Stage 11 - Documentation**:
- Blue/green deployment log
- Deployment timeline
- Traffic switch details
- Monitoring results
- Lessons learned

---

## Use Case 12: Scheduled Scan Deployment

*(Same as original - already comprehensive)*

---

## Use Case 13: Rolling Deployment

```
┌─────────────┐
│ Operations  │
└──────┬──────┘
       │ 1. Reviews new version
       │ 2. Configures rolling deployment
       │ 3. Initiates rolling update
       │ 4. Monitors rolling deployment
       │ 5. Validates each batch
       │ 6. Completes rolling deployment
       │ 7. Validates final state
       │ 8. Documents rolling deployment
```

**Responsibilities**:
- **Operations**: Manages rolling deployment, monitors, validates
- **Development**: (Provides new version via CI/CD)
- **CI/CD**: (May trigger deployment)
- **Infrastructure**: (Infrastructure already exists)

**Artifacts by Stage**:

**Stage 1 - New Version Review**:
- New task definition version
- New ECR image tag
- Change log review
- Risk assessment

**Stage 2 - Rolling Deployment Configuration**:
- Deployment configuration (JSON format uses camelCase):
  - `maximumPercent`: 200% (allows 2x tasks during deployment)
  - `minimumHealthyPercent`: 50% (maintains 50% capacity)
- Deployment circuit breaker enabled:
  - Enable: `true`
  - Rollback: `true` (automatic rollback on deployment failure)
  - Note: Circuit breaker triggers based on service health check failures during deployment, automatically rolling back if deployment fails
- Task replacement strategy
- Health check grace period
- Deployment timeout

**Stage 3 - Rolling Update Initiation**:
- ECS service update: `aws ecs update-service --cluster cluster-name --service service-name --task-definition family:new-revision`
- Service deployment ID
- Rolling update started
- Old tasks begin draining
- New tasks begin starting

**Stage 4 - Rolling Deployment Monitoring**:
- Task replacement progress
- Old task termination
- New task startup
- Service health during deployment
- Load balancer target registration
- Error rate during deployment

**Stage 5 - Batch Validation**:
- Each batch of new tasks validated
- Health checks passing
- Application functionality validated
- Performance acceptable
- Error rate acceptable

**Stage 6 - Rolling Deployment Completion**:
- All old tasks replaced
- All new tasks healthy
- Service fully updated
- Deployment completed

**Stage 7 - Final State Validation**:
- Service health validated
- Application functionality validated
- Performance validated
- Error rate validated
- User experience validated

**Stage 8 - Documentation**:
- Rolling deployment log
- Deployment timeline
- Batch validation results
- Monitoring results
- Lessons learned

---

## Use Case 14: Canary Deployment

```
┌─────────────┐
│ Operations  │
└──────┬──────┘
       │ 1. Reviews new version
       │ 2. Creates canary service
       │ 3. Routes small % traffic to canary
       │ 4. Monitors canary performance
       │ 5. Validates canary metrics
       │ 6. Gradually increases canary traffic
       │ 7. Validates at each stage
       │ 8. Promotes canary to full or rolls back
       │ 9. Documents canary deployment
```

**Responsibilities**:
- **Operations**: Manages canary deployment, traffic routing, monitoring, decision-making
- **Development**: (Provides new version via CI/CD)
- **CI/CD**: (May build image, but Operations manages deployment)
- **Infrastructure**: (Infrastructure already exists)

**Artifacts by Stage**:

**Stage 1 - New Version Review**:
- New task definition version
- New ECR image tag
- Change log review
- Risk assessment
- Canary strategy defined

**Stage 2 - Canary Service Creation**:
- New ECS service created: `service-name-canary`
- Service ARN: `arn:aws:ecs:region:account:service/cluster/service-canary`
- Task definition: new version
- Service configuration (smaller scale initially)
- Canary target group

**Stage 3 - Initial Traffic Routing**:
- Load balancer listener rules configured
- Small percentage traffic routed to canary (e.g., 5%, 10%)
- Majority traffic remains on production
- Traffic routing confirmed

**Stage 4 - Canary Monitoring**:
- Canary service metrics
- Application health status
- Error rates (canary vs. production)
- Performance metrics (canary vs. production)
- User experience metrics
- Business metrics (conversion rates, etc.)

**Stage 5 - Canary Validation**:
- Canary metrics compared to production baseline
- Error rate acceptable
- Performance acceptable
- User experience acceptable
- Business metrics acceptable
- No critical issues detected

**Stage 6 - Gradual Traffic Increase**:
- Traffic to canary increased (e.g., 5% → 10% → 25% → 50%)
- Each stage monitored
- Validation at each stage
- Rollback point defined at each stage

**Stage 7 - Stage Validation**:
- Validation at each traffic percentage
- Metrics compared
- Go/no-go decision at each stage
- Risk assessment at each stage

**Stage 8 - Promotion or Rollback**:
- **If successful**: Canary promoted to full production
  - All traffic switched to canary
  - Old production service terminated
  - Canary becomes new production
- **If issues detected**: Canary rolled back
  - Traffic reverted to production
  - Canary service terminated
  - Issues documented

**Stage 9 - Documentation**:
- Canary deployment log
- Deployment timeline
- Traffic percentage progression
- Metrics at each stage
- Decision points and rationale
- Lessons learned

---

## Use Case 15: Batch Job Deployment

```
┌─────────────┐
│ Development │
└──────┬──────┘
       │ 1. Commits batch job code
       │ 2. Pushes to GitHub
       ▼
┌─────────────┐
│   CI/CD     │
└──────┬──────┘
       │ 3. Builds image
       │ 4. Scans image
       │ 5. Pushes to ECR
       │ 6. Registers task definition
       │ 7. Deploys to Dev (test run)
       ▼
┌─────────────┐
│ Operations  │
└──────┬──────┘
       │ 8. Schedules batch job (EventBridge)
       │ 9. Monitors job execution
       │ 10. Validates job completion
       │ 11. Reviews job logs
       │ 12. Schedules production job
```

**Responsibilities**:
- **Development**: Commits code, maintains batch job logic
- **CI/CD**: Builds, scans, pushes image, registers task definition
- **Operations**: Schedules jobs, monitors execution, validates results
- **Infrastructure**: (Infrastructure already exists)

**Artifacts by Stage**:

**Stage 1-2 - Code Commit**:
- Batch job source code (Git)
- Task definition files (Git)
- Dockerfile (Git)
- buildspec.yaml (Git)
- Git commit SHA
- Job configuration (schedule, resources)

**Stage 3 - Image Build**:
- Docker image built
- Image tagged with commit SHA
- Build logs
- CodeBuild build ID

**Stage 4 - Image Scan**:
- Image scan results
- Vulnerability report
- Scan status (pass/fail)

**Stage 5 - ECR Push**:
- Image pushed to ECR: `account-id.dkr.ecr.region.amazonaws.com/batch-job-repo:tag`
- Image digest
- ECR push logs

**Stage 6 - Task Definition Registration**:
- Task definition JSON/YAML (task, not service)
- Task definition ARN: `arn:aws:ecs:region:account:task-definition/batch-job:revision`
- Task definition revision number
- Resource requirements (CPU, memory)
- Timeout configuration

**Stage 7 - Dev Test Run**:
- Task run in dev environment
- Task execution logs
- Job output validation
- Resource usage validation

**Stage 8 - Job Scheduling**:
- EventBridge rule created
- Schedule expression: `cron(0 2 * * ? *)` (example: daily at 2 AM)
- EventBridge rule ARN
- Rule target (ECS task)

**Stage 9 - Job Execution Monitoring**:
- Task execution status
- CloudWatch Logs
- Job progress monitoring
- Resource usage monitoring
- Execution time metrics

**Stage 10 - Job Completion Validation**:
- Job completion status
- Exit code validation
- Output validation
- Error handling validation

**Stage 11 - Job Logs Review**:
- CloudWatch Logs review
- Error analysis (if any)
- Performance analysis
- Resource usage analysis

**Stage 12 - Production Scheduling**:
- Production EventBridge rule created
- Production schedule configured
- Production monitoring configured
- Production alerting configured

---

## Use Case 16: Auto-Scaling Event

```
┌─────────────┐
│ CloudWatch   │
└──────┬──────┘
       │ 1. Metric threshold breached
       │ 2. Triggers alarm
       ▼
┌─────────────┐
│Application  │
│Auto Scaling │
└──────┬──────┘
       │ 3. Evaluates scaling policy
       │ 4. Calculates desired count
       │ 5. Updates service desired count
       │ 6. ECS starts new tasks
       │ 7. Load balancer registers targets
       ▼
┌─────────────┐
│ Operations  │
└──────┬──────┘
       │ 8. Monitors scaling event
       │ 9. Validates scaling success
       │ 10. Reviews cost impact
       │ 11. Documents scaling event
```

**Responsibilities**:
- **CloudWatch**: Monitors metrics, triggers alarms
- **Application Auto Scaling**: Executes scaling policies
- **ECS**: Starts/stops tasks based on desired count
- **Operations**: Monitors, validates, documents
- **Development**: (No direct involvement)

**Artifacts by Stage**:

**Stage 1 - Metric Threshold Breach**:
- CloudWatch metric (CPU, memory, request count, etc.)
- Metric value exceeds threshold
- Metric data points

**Stage 2 - Alarm Trigger**:
- CloudWatch alarm triggered
- Alarm ARN
- Alarm state change
- Alarm notification (SNS)

**Stage 3 - Scaling Policy Evaluation**:
- Auto-scaling policy evaluated
- Scaling policy type (target tracking, step scaling)
- Policy parameters reviewed

**Stage 4 - Desired Count Calculation**:
- New desired count calculated
- Scaling adjustment determined
- Min/max capacity constraints applied

**Stage 5 - Service Update**:
- ECS service desired count updated
- Service update initiated
- Service ARN: `arn:aws:ecs:region:account:service/cluster/service`

**Stage 6 - Task Startup**:
- New tasks started by ECS
- Task ARNs
- Task startup logs
- Task health checks

**Stage 7 - Load Balancer Registration**:
- New tasks registered with load balancer
- Target group health checks
- Traffic routing to new tasks

**Stage 8 - Scaling Event Monitoring**:
- Scaling event progress
- Task startup progress
- Service health during scaling
- Metric normalization
- Cost impact monitoring

**Stage 9 - Scaling Validation**:
- Scaling success validated
- Service health validated
- Metric normalization validated
- Performance validated

**Stage 10 - Cost Impact Review**:
- Cost impact assessed
- Resource usage reviewed
- Cost optimization opportunities identified

**Stage 11 - Documentation**:
- Scaling event log
- Scaling trigger
- Scaling duration
- Tasks added/removed
- Cost impact
- Lessons learned

---

## Use Case 17: Multi-Region Deployment

```
┌─────────────┐
│ Operations  │
└──────┬──────┘
       │ 1. Plans multi-region deployment
       │ 2. Provisions secondary region infrastructure
       │ 3. Configures ECR replication
       │ 4. Deploys to secondary region
       │ 5. Configures Route 53/DNS
       │ 6. Validates multi-region setup
       │ 7. Tests failover
       │ 8. Documents multi-region setup
```

**Responsibilities**:
- **Operations**: Plans, executes, validates multi-region deployment
- **Infrastructure**: Provisions secondary region infrastructure
- **CI/CD**: Deploys to multiple regions
- **Development**: (Provides application code)

**Artifacts by Stage**:

**Stage 1 - Multi-Region Planning**:
- Multi-region deployment plan
- Region selection (primary, secondary)
- Data replication strategy
- Failover strategy
- Cost assessment

**Stage 2 - Secondary Region Infrastructure**:
- ECS cluster in secondary region
- VPC and networking in secondary region
- Load balancer in secondary region
- IAM roles in secondary region
- CloudWatch Logs in secondary region

**Stage 3 - ECR Replication**:
- ECR replication configuration
- Source repository (primary region)
- Destination repository (secondary region)
- Replication rules
- Replication status monitoring

**Stage 4 - Secondary Region Deployment**:
- ECS service deployed to secondary region
- Task definition registered in secondary region
- Service ARN (secondary region)
- Service health validated

**Stage 5 - Route 53/DNS Configuration**:
- Route 53 health checks configured
- DNS routing policy (failover, weighted, latency-based)
- Route 53 record sets
- DNS failover configuration

**Stage 6 - Multi-Region Validation**:
- Both regions operational
- Health checks passing
- Traffic routing validated
- Data replication validated

**Stage 7 - Failover Testing**:
- Failover test executed
- Primary region simulated failure
- Secondary region activated
- Failover time measured
- Failover validation

**Stage 8 - Documentation**:
- Multi-region setup documentation
- Failover procedures
- Region-specific configurations
- Monitoring setup
- Cost breakdown

---

## Use Case 18: ECS Exec Container Debugging

```
┌─────────────┐
│ Operations  │
└──────┬──────┘
       │ 1. Identifies container issue
       │ 2. Enables ECS Exec on service
       │ 3. Connects to running container
       │ 4. Debugs issue
       │ 5. Documents findings
       │ 6. Disables ECS Exec (if temporary)
```

**Responsibilities**:
- **Operations**: Enables ECS Exec, connects to containers, debugs issues
- **Development**: (May assist with debugging)
- **Infrastructure**: (Ensures ECS Exec prerequisites are met)
- **CI/CD**: (Not involved)

**Prerequisites**:
- ECS Exec requires:
  - ECS platform version 1.4.0 or later
  - Task execution role with `ssmmessages:CreateControlChannel`, `ssmmessages:CreateDataChannel`, `ssmmessages:OpenControlChannel`, `ssmmessages:OpenDataChannel` permissions
  - AWS Systems Manager Agent (SSM Agent) in container image (for EC2 launch type)
  - Fargate tasks automatically include SSM Agent

**Artifacts by Stage**:

**Stage 1 - Issue Identification**:
- Container issue identified
- Task ARN: `arn:aws:ecs:region:account:task/cluster/task-id`
- Container name
- Issue description
- Logs reviewed (insufficient for debugging)

**Stage 2 - ECS Exec Enablement**:
- ECS Exec enabled on service (if not already enabled):
  - `aws ecs update-service --enable-execute-command --service service-name --cluster cluster-name`
- Service update confirmation
- ECS Exec configuration:
  - EnableExecuteCommand: `true`
  - Task execution role updated with SSM permissions (if needed)
- Service ARN: `arn:aws:ecs:region:account:service/cluster/service`

**Stage 3 - Container Connection**:
- AWS CLI command: `aws ecs execute-command --cluster cluster-name --task task-id --container container-name --interactive --command "/bin/sh"`
  - Note: `--command` parameter is optional; if omitted, uses container's default entrypoint
- ECS Exec session established
- Interactive shell access to container
- Connection confirmation

**Stage 4 - Issue Debugging**:
- Container filesystem inspection
- Process inspection (`ps`, `top`)
- Network connectivity testing
- Environment variables inspection
- Application logs review (inside container)
- Configuration file inspection
- Debugging session logs
- Issue root cause identified

**Stage 5 - Documentation**:
- Debugging session notes
- Issue root cause documented
- Resolution steps documented
- Prevention measures identified
- ECS Exec usage logged (for audit)

**Stage 6 - ECS Exec Disablement (Optional)**:
- ECS Exec disabled on service (if temporary enablement):
  - `aws ecs update-service --no-enable-execute-command --service service-name --cluster cluster-name`
- Service update confirmation
- Security note: ECS Exec should be enabled only when needed for production services

**Security Considerations**:
- ECS Exec sessions are logged in CloudTrail
- Access can be restricted via IAM policies
- ECS Exec should be disabled when not needed (security best practice)
- Use least privilege IAM roles for ECS Exec access
- Audit ECS Exec usage regularly

---

## Responsibility Summary

### Development Team
- ✅ Commits code
- ✅ Builds container images
- ✅ Maintains CI/CD pipeline code
- ✅ Fixes application issues
- ✅ Defines image tagging strategies
- ✅ Implements batch jobs and scheduled tasks
- ❌ Does not deploy to production manually (except emergencies)
- ❌ Does not manage production runtime

### CI/CD Pipeline
- ✅ Builds images
- ✅ Scans images (ECR + third-party)
- ✅ Tags images (multiple strategies)
- ✅ Registers task definitions
- ✅ Deploys to environments
- ✅ Executes automated tests
- ✅ Manages ECR image lifecycle
- ❌ Does not make deployment decisions
- ❌ Does not monitor production

### Operations Team
- ✅ Monitors CI/CD deployments
- ✅ Approves production deployments
- ✅ Executes manual deployments (exceptions)
- ✅ Monitors production runtime
- ✅ Handles rollbacks
- ✅ Manages service configuration
- ✅ Manages blue/green, rolling, canary deployments
- ✅ Schedules batch jobs
- ✅ Monitors auto-scaling events
- ❌ Does not provision infrastructure
- ❌ Does not write application code

### Infrastructure Team
- ✅ Provisions ECS clusters
- ✅ Creates VPC/networking
- ✅ Sets up IAM roles
- ✅ Configures security groups
- ✅ Provides scanning infrastructure
- ✅ Configures ECR repositories and policies
- ✅ Sets up multi-region infrastructure
- ❌ Does not deploy applications
- ❌ Does not manage production services

---

## Deployment Flow Decision Tree - Enhanced

```
Start Deployment
    │
    ├─ Code Change?
    │   │
    │   ├─ Yes → CI/CD Pipeline
    │   │          │
    │   │          ├─ Emergency?
    │   │          │   │
    │   │          │   ├─ Yes → Manual Deployment (Operations)
    │   │          │   └─ No → Normal CI/CD Flow
    │   │          │
    │   │          ├─ Deployment Strategy?
    │   │          │   │
    │   │          │   ├─ Blue/Green → Operations manages
    │   │          │   ├─ Rolling → ECS automatic
    │   │          │   ├─ Canary → Operations manages
    │   │          │   └─ Default → ECS rolling update
    │   │          │
    │   │          └─ Normal Flow:
    │   │              Development → CI/CD → Operations (approve) → CI/CD → Production
    │   │
    │   └─ No → Configuration Change
    │              │
    │              └─ Operations Manual Update
    │
    ├─ Batch Job?
    │   │
    │   └─ Yes → CI/CD builds → Operations schedules
    │
    ├─ Auto-Scaling Event?
    │   │
    │   └─ Yes → Application Auto Scaling → ECS → Operations monitors
    │
    └─ Rollback?
        │
        └─ Yes → Operations Manual Rollback
```

---

## Quick Reference Matrix - Enhanced

| Action | Development | CI/CD | Operations | Infrastructure |
|--------|------------|-------|------------|---------------|
| **Commit Code** | ✅ | - | - | - |
| **Build Image** | ✅ | ✅ | - | - |
| **Scan Image** | - | ✅ | - | - |
| **Tag Image** | ⚙️ Strategy | ✅ Execute | - | - |
| **Push to ECR** | - | ✅ | - | - |
| **Deploy to Dev** | - | ✅ | ⚙️ Monitor | - |
| **Deploy to Staging** | - | ✅ | ⚙️ Monitor | - |
| **Approve Production** | - | - | ✅ | - |
| **Deploy to Prod** | - | ✅ | ⚙️ Monitor | - |
| **Blue/Green Deploy** | - | ⚙️ Build | ✅ Execute | - |
| **Rolling Deploy** | - | ✅ | ⚙️ Monitor | - |
| **Canary Deploy** | - | ⚙️ Build | ✅ Execute | - |
| **Monitor Production** | - | - | ✅ | - |
| **Manual Deployment** | ⚙️ Build | - | ✅ Execute | - |
| **Rollback** | ⚙️ Fix | - | ✅ Execute | - |
| **Config Change** | - | - | ✅ | - |
| **Batch Job Schedule** | ⚙️ Code | ⚙️ Build | ✅ Schedule | - |
| **Auto-Scaling** | - | - | ⚙️ Monitor | - |
| **Provision Cluster** | ⚙️ Request | - | - | ✅ |
| **Setup ECR** | ⚙️ Request | - | - | ✅ |
| **Setup Scanning** | - | - | ⚙️ Configure | ✅ Provision |
| **Multi-Region Setup** | - | ⚙️ Deploy | ✅ Plan | ✅ Provision |
| **Enable Container Insights** | - | - | ⚙️ Validate | ✅ Provision |
| **ECS Exec Debugging** | - | - | ✅ Execute | ⚙️ Configure |

**Legend**:
- ✅ = Primary responsibility
- ⚙️ = Secondary/involvement
- - = No involvement

---

## ECR Integration Summary

### Image Tagging Strategies
- **Git SHA**: `sha-abc123` (immutable, traceable)
- **Semantic Version**: `v1.2.3` (version management)
- **Environment**: `dev`, `staging`, `prod` (environment promotion)
- **Build Number**: `build-123` (CI/CD build tracking)
- **Combined**: `v1.2.3-sha-abc123` (comprehensive tracking)
- **Hotfix**: `hotfix-20240115-1430` (emergency deployments)
- **Latest**: `latest` (dev only, not for production)

### ECR Lifecycle Policies
- **Untagged Images**: Retain 7 days (cost optimization)
- **Tagged Images**: Keep last 10 versions per tag pattern
- **Age-based**: Delete images older than 90 days
- **Environment-specific**: Different retention per environment

### ECR Security
- **Scanning**: Scan on push + continuous scanning
- **Severity Thresholds**: Block on CRITICAL/HIGH (configurable)
- **Image Signing**: Optional for compliance requirements
- **Access Control**: IAM roles for ECR pull/push
- **Network Security**: VPC endpoints for private access

### ECR Cost Optimization
- **Lifecycle Policies**: Automatic cleanup of old images
- **Layer Deduplication**: Shared layers across images
- **Cross-Region Replication**: Only when needed
- **Storage Classes**: Standard storage (no Glacier for ECR)

---

## Related Documents

- [Operations Team Responsibilities](./operations-team.md) - Complete Operations responsibilities
- [ECS Deployment Strategies](./ecs-deployment.md) - Detailed deployment breakdown
- [CI/CD Automation](./cicd-automation.md) - CI/CD impact on responsibilities
- [Development Team Responsibilities](./development-team.md) - Development responsibilities
- [Infrastructure Team Responsibilities](./infrastructure-team.md) - Infrastructure responsibilities
- [ECR Best Practices](./ecr-best-practices.md) - ECR integration guidelines
- [context.md](./context.md) - AI prompts for use case validation and refinement

---

## Document Version History

- **v2.2 (Validated)**: Fixed deployment circuit breaker configuration, corrected AWS CLI commands, clarified Container Insights as cluster setting, added JSON format clarifications
- **v2.1 (Enhanced)**: Added Container Insights, Deployment Circuit Breaker, ECS Exec debugging, enhanced health check configurations
- **v2.0 (Augmented)**: Enhanced with ECR deep integration, additional use cases (rolling, canary, batch jobs, auto-scaling, multi-region), improved artifacts, and best practices alignment
- **v1.0 (Original)**: Initial comprehensive use cases document

