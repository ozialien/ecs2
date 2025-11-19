# Use Case 2: ECR Repository Setup - CDK

> **Purpose**: Create and configure ECR repository with scanning and lifecycle policies  
> **Format**: AWS CDK (TypeScript)  
> **Idempotent**: Yes

## Quick Start

```bash
npm install
npm run build
cdk deploy --context project=myapp --context environment=dev
```

## Configuration

| Context Variable | Default | Description |
|------------------|---------|-------------|
| `repositoryName` | `{project}-{env}` | ECR repository name |
| `enableScanOnPush` | `true` | Enable scan on push |
| `enableContinuousScan` | `false` | Enable continuous scanning |
| `imageTagMutability` | `MUTABLE` | Image tag mutability |
| `encryptionType` | `AES256` | Encryption type (AES256/KMS) |

## Outputs

- Repository URI
- Repository ARN
- Repository Name

