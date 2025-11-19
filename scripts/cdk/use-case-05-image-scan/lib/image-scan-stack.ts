import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface ImageScanStackProps extends cdk.StackProps {
  projectName: string;
  environment: string;
  ecrRepositoryName: string;
  enableContinuousScan?: boolean;
}

export class ImageScanStack extends cdk.Stack {
  public readonly scanFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: ImageScanStackProps) {
    super(scope, id, props);

    const {
      projectName,
      environment,
      ecrRepositoryName,
      enableContinuousScan = false,
    } = props;

    // Lambda function to trigger ECR scan
    const scanRole = new iam.Role(this, 'ScanRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    scanRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ecr:StartImageScan',
          'ecr:DescribeImageScanFindings',
          'ecr:GetAuthorizationToken',
        ],
        resources: ['*'],
      })
    );

    this.scanFunction = new lambda.Function(this, 'ScanFunction', {
      functionName: `${projectName}-image-scan-${environment}`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      role: scanRole,
      code: lambda.Code.fromInline(`
import boto3
import json

ecr = boto3.client('ecr')

def handler(event, context):
    repository = '${ecrRepositoryName}'
    
    try:
        # Get latest image
        response = ecr.describe_images(
            repositoryName=repository,
            maxResults=1
        )
        
        if not response['imageDetails']:
            return {'statusCode': 404, 'body': 'No images found'}
        
        image_tag = response['imageDetails'][0]['imageTags'][0] if response['imageDetails'][0].get('imageTags') else 'latest'
        
        # Start scan
        scan_response = ecr.start_image_scan(
            repositoryName=repository,
            imageId={'imageTag': image_tag}
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Image scan started',
                'repository': repository,
                'imageTag': image_tag
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
`),
    });

    // EventBridge rule for scheduled scans (if enabled)
    if (enableContinuousScan) {
      const rule = new events.Rule(this, 'ScanSchedule', {
        schedule: events.Schedule.rate(cdk.Duration.hours(24)),
        description: `Daily image scan for ${ecrRepositoryName}`,
      });

      rule.addTarget(new targets.LambdaFunction(this.scanFunction));
    }

    new cdk.CfnOutput(this, 'ScanFunctionArn', {
      value: this.scanFunction.functionArn,
      description: 'Lambda Function ARN for image scanning',
    });
  }
}

