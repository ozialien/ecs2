# Idempotency Notes

All CloudFormation and CDK scripts are designed to be **fully idempotent** - they can be run multiple times safely without creating duplicate resources or errors.

## CloudFormation Scripts

### Fixed Stack Names
- **Default**: Stack names use fixed pattern: `${PROJECT_NAME}-${USE_CASE}-${ENVIRONMENT}`
- **Override**: Set `STACK_NAME` environment variable to use a custom stack name
- **Example**: `STACK_NAME=my-custom-stack ./deploy.sh myapp dev`

### Deploy Command
- All scripts use `aws cloudformation deploy` which automatically:
  - Creates the stack if it doesn't exist
  - Updates the stack if it exists and changes are detected
  - Does nothing if the stack is already in the desired state
- This is more reliable than manually checking and using `create-stack`/`update-stack`

### Example
```bash
# First run - creates stack
./deploy.sh myapp dev

# Second run - updates stack (if changes) or does nothing (if no changes)
./deploy.sh myapp dev

# Third run - same as second run
./deploy.sh myapp dev
```

## CDK Scripts

### Fixed Stack Names
- **Default**: Stack names use fixed pattern: `${projectName}-${useCase}-${environment}`
- **Override Options**:
  - Set `stackName` context: `cdk deploy --context stackName=my-custom-stack`
  - Set `uniqueId` context for parallel deployments: `cdk deploy --context uniqueId=branch-123`

### CDK Inherent Idempotency
- CDK is inherently idempotent - it compares desired state with current state
- Only makes changes when differences are detected
- Safe to run `cdk deploy` multiple times

### Example
```bash
# First run - creates stack
cdk deploy --context project=myapp --context environment=dev

# Second run - updates stack (if changes) or does nothing (if no changes)
cdk deploy --context project=myapp --context environment=dev

# Parallel deployment (different stack)
cdk deploy --context project=myapp --context environment=dev --context uniqueId=feature-branch
```

## Ansible Playbooks

### Inherent Idempotency
- Ansible modules are inherently idempotent
- They check current state and only make changes if needed
- Safe to run playbooks multiple times

### Example
```bash
# First run - creates resources
ansible-playbook main.yml -e "project=myapp" -e "env=dev"

# Second run - checks state, makes no changes if already correct
ansible-playbook main.yml -e "project=myapp" -e "env=dev"
```

## Key Principles

1. **Fixed Resource Names**: Resources use predictable names based on project/environment
2. **State Comparison**: All tools compare desired state with current state
3. **No Timestamps in Default Names**: Timestamps removed from default stack names
4. **Override Capability**: Can still use unique IDs for parallel deployments when needed

## Migration Notes

If you have existing stacks created with timestamp-based names:
- Option 1: Keep using them (they'll continue to work)
- Option 2: Export outputs, delete old stack, redeploy with fixed name
- Option 3: Use `STACK_NAME` env var to point to existing stack

