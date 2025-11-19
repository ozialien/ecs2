import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';

export interface EmergencyHotfixStackProps extends cdk.StackProps {
  projectName: string;
  environment: string;
  clusterName: string;
  serviceName: string;
  hotfixImageUri: string;
  hotfixTag: string;
}

export class EmergencyHotfixStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EmergencyHotfixStackProps) {
    super(scope, id, props);

    const {
      clusterName,
      serviceName,
      hotfixImageUri,
      hotfixTag,
    } = props;

    const cluster = ecs.Cluster.fromClusterName(this, 'Cluster', clusterName);
    const service = ecs.FargateService.fromServiceName(this, 'Service', cluster, serviceName);

    // Note: Emergency hotfix is typically done via AWS CLI for speed
    // This stack provides the command template
    
    new cdk.CfnOutput(this, 'HotfixCommand', {
      value: `aws ecs update-service --cluster ${clusterName} --service ${serviceName} --task-definition <family>:<revision-with-hotfix-image> --force-new-deployment --region ${this.region}`,
      description: 'AWS CLI command to deploy emergency hotfix',
    });

    new cdk.CfnOutput(this, 'HotfixImage', {
      value: `${hotfixImageUri}:${hotfixTag}`,
      description: 'Hotfix image URI',
    });

    new cdk.CfnOutput(this, 'Note', {
      value: 'Emergency hotfix typically requires: 1) Build hotfix image 2) Push to ECR 3) Update task definition 4) Force deployment',
      description: 'Hotfix procedure',
    });
  }
}

