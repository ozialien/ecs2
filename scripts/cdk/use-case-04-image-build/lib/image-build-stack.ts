import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface ImageBuildStackProps extends cdk.StackProps {
  projectName: string;
  environment: string;
  ecrRepositoryUri: string;
  sourceLocation: string;
  dockerfilePath?: string;
}

export class ImageBuildStack extends cdk.Stack {
  public readonly buildProject: codebuild.Project;

  constructor(scope: Construct, id: string, props: ImageBuildStackProps) {
    super(scope, id, props);

    const {
      projectName,
      environment,
      ecrRepositoryUri,
      sourceLocation,
      dockerfilePath = 'Dockerfile',
    } = props;

    // CodeBuild Role
    const buildRole = new iam.Role(this, 'BuildRole', {
      roleName: `${projectName}-codebuild-role-${environment}`,
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
    });

    buildRole.addToPolicy(
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

    // CodeBuild Project
    this.buildProject = new codebuild.Project(this, 'BuildProject', {
      projectName: `${projectName}-build-${environment}`,
      role: buildRole,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.SMALL,
        privileged: true,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              `aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin ${ecrRepositoryUri}`,
              'COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)',
              'IMAGE_TAG=${COMMIT_HASH}',
            ],
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'echo Building the Docker image...',
              `docker build -t ${ecrRepositoryUri}:$IMAGE_TAG -f ${dockerfilePath} .`,
              `docker tag ${ecrRepositoryUri}:$IMAGE_TAG ${ecrRepositoryUri}:latest`,
            ],
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              'echo Pushing the Docker images...',
              `docker push ${ecrRepositoryUri}:$IMAGE_TAG`,
              `docker push ${ecrRepositoryUri}:latest`,
            ],
          },
        },
      }),
      source: codebuild.Source.gitHub({
        owner: sourceLocation.split('/')[0],
        repo: sourceLocation.split('/')[1],
      }),
    });

    new cdk.CfnOutput(this, 'BuildProjectName', {
      value: this.buildProject.projectName,
      description: 'CodeBuild Project Name',
    });
  }
}

