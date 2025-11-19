import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface ECRRepositoryStackProps extends cdk.StackProps {
  projectName: string;
  environment: string;
  repositoryName: string;
  enableScanOnPush?: boolean;
  enableContinuousScan?: boolean;
  imageTagMutability?: 'MUTABLE' | 'IMMUTABLE';
  lifecyclePolicy?: string;
  encryptionType?: 'AES256' | 'KMS';
  kmsKeyId?: string;
  enableCrossRegionReplication?: boolean;
  replicationRegions?: string[];
}

export class ECRRepositoryStack extends cdk.Stack {
  public readonly repository: ecr.Repository;
  public readonly scanNotificationTopic?: sns.Topic;

  constructor(scope: Construct, id: string, props: ECRRepositoryStackProps) {
    super(scope, id, props);

    const {
      projectName,
      environment,
      repositoryName,
      enableScanOnPush = true,
      enableContinuousScan = false,
      imageTagMutability = 'MUTABLE',
      encryptionType = 'AES256',
      kmsKeyId,
      enableCrossRegionReplication = false,
      replicationRegions = [],
    } = props;

    // SNS Topic for scan notifications (optional)
    this.scanNotificationTopic = new sns.Topic(this, 'ScanNotificationTopic', {
      topicName: `${projectName}-ecr-scan-notifications-${environment}`,
      displayName: `ECR Scan Notifications - ${projectName} - ${environment}`,
    });

    // ECR Repository
    this.repository = new ecr.Repository(this, 'ECRRepository', {
      repositoryName: repositoryName,
      imageTagMutability: imageTagMutability === 'IMMUTABLE' 
        ? ecr.TagMutability.IMMUTABLE 
        : ecr.TagMutability.MUTABLE,
      imageScanOnPush: enableScanOnPush,
      encryption: encryptionType === 'KMS' && kmsKeyId
        ? ecr.RepositoryEncryption.KMS
        : ecr.RepositoryEncryption.AES_256,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Keep images even if stack deleted
      lifecycleRules: [
        {
          rulePriority: 1,
          description: 'Keep last 10 tagged images',
          tagStatus: ecr.TagStatus.TAGGED,
          maxImageCount: 10,
        },
        {
          rulePriority: 2,
          description: 'Delete untagged images older than 7 days',
          tagStatus: ecr.TagStatus.UNTAGGED,
          maxImageAge: cdk.Duration.days(7),
        },
        {
          rulePriority: 3,
          description: 'Delete images older than 90 days',
          tagStatus: ecr.TagStatus.ANY,
          maxImageAge: cdk.Duration.days(90),
        },
      ],
    });

    // Enable continuous scanning if requested
    if (enableContinuousScan) {
      // Note: Continuous scanning is enabled via AWS CLI or console
      // CDK doesn't have direct support, but we can add a custom resource
      new cdk.CfnOutput(this, 'ContinuousScanNote', {
        value: 'Enable continuous scanning via AWS Console or CLI',
        description: 'Continuous scanning must be enabled separately',
      });
    }

    // Repository policy for cross-account access (if needed)
    if (props.enableCrossRegionReplication) {
      // Note: Cross-region replication requires additional setup
      new cdk.CfnOutput(this, 'ReplicationNote', {
        value: 'Configure cross-region replication via AWS Console or CLI',
        description: 'Replication configuration',
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'RepositoryUri', {
      value: this.repository.repositoryUri,
      description: 'ECR Repository URI',
      exportName: `${projectName}-ecr-repository-uri-${environment}`,
    });

    new cdk.CfnOutput(this, 'RepositoryArn', {
      value: this.repository.repositoryArn,
      description: 'ECR Repository ARN',
      exportName: `${projectName}-ecr-repository-arn-${environment}`,
    });

    new cdk.CfnOutput(this, 'RepositoryName', {
      value: this.repository.repositoryName,
      description: 'ECR Repository Name',
    });
  }
}

