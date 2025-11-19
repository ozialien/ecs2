import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';

export interface CICDPipelineStackProps extends cdk.StackProps {
  projectName: string;
  environment: string;
  sourceRepository: string;
  sourceBranch: string;
  codeStarConnectionArn?: string;
  ecrRepositoryUri?: string;
  ecsClusterName?: string;
  ecsServiceName?: string;
  enableApprovalGate?: boolean;
}

export class CICDPipelineStack extends cdk.Stack {
  public readonly pipeline: codepipeline.Pipeline;
  public readonly artifactsBucket: s3.Bucket;
  public readonly codeBuildRole: iam.Role;

  constructor(scope: Construct, id: string, props: CICDPipelineStackProps) {
    super(scope, id, props);

    const {
      projectName,
      environment,
      sourceRepository,
      sourceBranch,
      codeStarConnectionArn,
      ecrRepositoryUri,
      ecsClusterName,
      ecsServiceName,
      enableApprovalGate = true,
    } = props;

    // S3 Bucket for Pipeline Artifacts
    this.artifactsBucket = new s3.Bucket(this, 'ArtifactsBucket', {
      bucketName: `${projectName}-pipeline-artifacts-${environment}-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'DeleteOldArtifacts',
          expiration: cdk.Duration.days(30),
        },
      ],
    });

    // CodeBuild Role
    this.codeBuildRole = new iam.Role(this, 'CodeBuildRole', {
      roleName: `${projectName}-codebuild-role-${environment}`,
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
    });

    // ECR permissions
    this.codeBuildRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ecr:GetAuthorizationToken',
          'ecr:BatchCheckLayerAvailability',
          'ecr:GetDownloadUrlForLayer',
          'ecr:BatchGetImage',
          'ecr:PutImage',
          'ecr:InitiateLayerUpload',
          'ecr:UploadLayerPart',
          'ecr:CompleteLayerUpload',
        ],
        resources: ['*'],
      })
    );

    // ECS permissions
    this.codeBuildRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ecs:RegisterTaskDefinition',
          'ecs:DescribeTaskDefinition',
          'ecs:UpdateService',
          'ecs:DescribeServices',
        ],
        resources: ['*'],
      })
    );

    // S3 permissions
    this.artifactsBucket.grantReadWrite(this.codeBuildRole);

    // CodeBuild Project
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      projectName: `${projectName}-build-${environment}`,
      role: this.codeBuildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        privileged: true, // Required for Docker
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              `aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin ${ecrRepositoryUri || '${ECR_REPOSITORY_URI}'}`,
              'COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)',
              'IMAGE_TAG=${COMMIT_HASH}',
            ],
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'echo Building the Docker image...',
              `docker build -t ${ecrRepositoryUri || '${ECR_REPOSITORY_URI}'}:$IMAGE_TAG .`,
              `docker tag ${ecrRepositoryUri || '${ECR_REPOSITORY_URI}'}:$IMAGE_TAG ${ecrRepositoryUri || '${ECR_REPOSITORY_URI}'}:latest`,
            ],
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              'echo Pushing the Docker images...',
              `docker push ${ecrRepositoryUri || '${ECR_REPOSITORY_URI}'}:$IMAGE_TAG`,
              `docker push ${ecrRepositoryUri || '${ECR_REPOSITORY_URI}'}:latest`,
              'echo Writing image definitions file...',
              `printf '[{"name":"${ECS_SERVICE_NAME}","imageUri":"${ecrRepositoryUri || '${ECR_REPOSITORY_URI}'}:$IMAGE_TAG"}]' > imagedefinitions.json`,
            ],
          },
        },
        artifacts: {
          files: ['imagedefinitions.json', 'appspec.yaml'],
        },
      }),
    });

    // Pipeline
    this.pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `${projectName}-pipeline-${environment}`,
      artifactBucket: this.artifactsBucket,
      restartExecutionOnUpdate: true,
    });

    // Source Stage
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    
    if (codeStarConnectionArn) {
      // GitHub via CodeStar Connection
      this.pipeline.addStage({
        stageName: 'Source',
        actions: [
          new codepipeline_actions.CodeStarConnectionsSourceAction({
            actionName: 'GitHub_Source',
            owner: sourceRepository.split('/')[0],
            repo: sourceRepository.split('/')[1],
            branch: sourceBranch,
            connectionArn: codeStarConnectionArn,
            output: sourceOutput,
          }),
        ],
      });
    } else {
      // S3 Source (fallback)
      const sourceBucket = new s3.Bucket(this, 'SourceBucket', {
        bucketName: `${projectName}-source-${environment}-${this.account}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
      
      this.pipeline.addStage({
        stageName: 'Source',
        actions: [
          new codepipeline_actions.S3SourceAction({
            actionName: 'S3_Source',
            bucket: sourceBucket,
            bucketKey: 'source.zip',
            output: sourceOutput,
          }),
        ],
      });
    }

    // Build Stage
    const buildOutput = new codepipeline.Artifact('BuildOutput');
    this.pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Build',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    // Approval Stage (if enabled)
    if (enableApprovalGate) {
      this.pipeline.addStage({
        stageName: 'Approval',
        actions: [
          new codepipeline_actions.ManualApprovalAction({
            actionName: 'ManualApproval',
            additionalInformation: `Approve deployment to ${environment}`,
          }),
        ],
      });
    }

    // Deploy Stage
    if (ecsClusterName && ecsServiceName) {
      this.pipeline.addStage({
        stageName: 'Deploy',
        actions: [
          new codepipeline_actions.EcsDeployAction({
            actionName: 'Deploy',
            service: ecs.Cluster.fromClusterName(this, 'Cluster', ecsClusterName)
              .addDefaultCapacityProvider('FARGATE', {
                spot: false,
              })
              .addDefaultCapacityProvider('FARGATE_SPOT', {
                spot: true,
              })
              .getService(ecsServiceName),
            input: buildOutput,
          }),
        ],
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'PipelineName', {
      value: this.pipeline.pipelineName,
      description: 'CodePipeline Name',
    });

    new cdk.CfnOutput(this, 'PipelineArn', {
      value: this.pipeline.pipelineArn,
      description: 'CodePipeline ARN',
    });

    new cdk.CfnOutput(this, 'ArtifactsBucketName', {
      value: this.artifactsBucket.bucketName,
      description: 'S3 Artifacts Bucket Name',
    });
  }
}

