import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';

export interface RollingDeploymentStackProps extends cdk.StackProps {
  projectName: string;
  environment: string;
  clusterName: string;
  serviceName: string;
  taskDefinitionArn: string;
  maximumPercent?: number;
  minimumHealthyPercent?: number;
}

export class RollingDeploymentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: RollingDeploymentStackProps) {
    super(scope, id, props);

    const {
      clusterName,
      serviceName,
      taskDefinitionArn,
      maximumPercent = 200,
      minimumHealthyPercent = 50,
    } = props;

    const cluster = ecs.Cluster.fromClusterName(this, 'Cluster', clusterName);
    const service = ecs.FargateService.fromServiceName(this, 'Service', cluster, serviceName);

    // Update service with rolling deployment configuration
    // Note: CDK doesn't support direct service updates, this would be done via AWS CLI
    // This stack documents the configuration
    
    new cdk.CfnOutput(this, 'RollingDeploymentConfig', {
      value: JSON.stringify({
        maximumPercent,
        minimumHealthyPercent,
        deploymentCircuitBreaker: {
          enable: true,
          rollback: true,
        },
      }),
      description: 'Rolling deployment configuration',
    });

    new cdk.CfnOutput(this, 'UpdateCommand', {
      value: `aws ecs update-service --cluster ${clusterName} --service ${serviceName} --task-definition ${taskDefinitionArn} --deployment-configuration maximumPercent=${maximumPercent},minimumHealthyPercent=${minimumHealthyPercent} --deployment-circuit-breaker enable=true,rollback=true`,
      description: 'AWS CLI command to perform rolling deployment',
    });
  }
}

