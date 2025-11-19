import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';

export interface ConfigChangeStackProps extends cdk.StackProps {
  projectName: string;
  environment: string;
  clusterName: string;
  serviceName: string;
  newConfig: {
    cpu?: string;
    memory?: string;
    desiredCount?: number;
    environmentVariables?: Record<string, string>;
  };
}

export class ConfigChangeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ConfigChangeStackProps) {
    super(scope, id, props);

    const {
      clusterName,
      serviceName,
      newConfig,
    } = props;

    const cluster = ecs.Cluster.fromClusterName(this, 'Cluster', clusterName);
    const service = ecs.FargateService.fromServiceName(this, 'Service', cluster, serviceName);

    // Note: Config changes require updating task definition and service
    // This stack provides command templates
    
    new cdk.CfnOutput(this, 'UpdateCommand', {
      value: `aws ecs update-service --cluster ${clusterName} --service ${serviceName} --task-definition <new-task-def-arn> --desired-count ${newConfig.desiredCount || 'current'} --region ${this.region}`,
      description: 'AWS CLI command to update service configuration',
    });

    new cdk.CfnOutput(this, 'ConfigChanges', {
      value: JSON.stringify(newConfig, null, 2),
      description: 'Configuration changes to apply',
    });
  }
}

