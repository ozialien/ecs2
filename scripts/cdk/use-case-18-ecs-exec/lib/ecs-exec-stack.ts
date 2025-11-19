import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface ECSExecStackProps extends cdk.StackProps {
  projectName: string;
  environment: string;
  clusterName: string;
  serviceName: string;
  enableExec: boolean;
}

export class ECSExecStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ECSExecStackProps) {
    super(scope, id, props);

    const {
      clusterName,
      serviceName,
      enableExec,
    } = props;

    const cluster = ecs.Cluster.fromClusterName(this, 'Cluster', clusterName);
    const service = ecs.FargateService.fromServiceName(this, 'Service', cluster, serviceName);

    // Update service to enable/disable ECS Exec
    // Note: CDK doesn't support direct enableExecuteCommand update
    // This would be done via AWS CLI: aws ecs update-service --enable-execute-command
    
    new cdk.CfnOutput(this, 'EnableCommand', {
      value: enableExec
        ? `aws ecs update-service --cluster ${clusterName} --service ${serviceName} --enable-execute-command --region ${this.region}`
        : `aws ecs update-service --cluster ${clusterName} --service ${serviceName} --no-enable-execute-command --region ${this.region}`,
      description: 'AWS CLI command to enable/disable ECS Exec',
    });

    new cdk.CfnOutput(this, 'ExecuteCommand', {
      value: `aws ecs execute-command --cluster ${clusterName} --task <task-id> --container <container-name> --interactive --command "/bin/sh"`,
      description: 'AWS CLI command to execute command in container',
    });

    // Note: ECS Exec requires task execution role to have SSM permissions
    // These should be added to the task execution role (done in prerequisites)
  }
}

