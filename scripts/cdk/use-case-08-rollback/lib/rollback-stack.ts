import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface RollbackStackProps extends cdk.StackProps {
  projectName: string;
  environment: string;
  clusterName: string;
  serviceName: string;
  previousTaskDefinitionRevision: string;
}

export class RollbackStack extends cdk.Stack {
  public readonly rollbackFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: RollbackStackProps) {
    super(scope, id, props);

    const {
      projectName,
      environment,
      clusterName,
      serviceName,
      previousTaskDefinitionRevision,
    } = props;

    // Lambda function for rollback
    const rollbackRole = new iam.Role(this, 'RollbackRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    rollbackRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ecs:UpdateService',
          'ecs:DescribeServices',
          'ecs:DescribeTaskDefinition',
        ],
        resources: ['*'],
      })
    );

    this.rollbackFunction = new lambda.Function(this, 'RollbackFunction', {
      functionName: `${projectName}-rollback-${environment}`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      role: rollbackRole,
      code: lambda.Code.fromInline(`
import boto3
import json

ecs = boto3.client('ecs')

def handler(event, context):
    cluster = '${clusterName}'
    service = '${serviceName}'
    task_def_revision = '${previousTaskDefinitionRevision}'
    
    # Get task definition family from revision
    task_def_family = task_def_revision.split(':')[0]
    
    try:
        response = ecs.update_service(
            cluster=cluster,
            service=service,
            taskDefinition=task_def_revision
        )
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Rollback initiated',
                'service': service,
                'taskDefinition': task_def_revision,
                'deploymentId': response['service']['deployments'][0]['id']
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }
`),
    });

    // Outputs
    new cdk.CfnOutput(this, 'RollbackFunctionArn', {
      value: this.rollbackFunction.functionArn,
      description: 'Lambda Function ARN for rollback',
    });
  }
}

