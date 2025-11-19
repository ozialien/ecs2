import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import { Construct } from 'constructs';

export interface BlueGreenStackProps extends cdk.StackProps {
  projectName: string;
  environment: string;
  clusterName: string;
  serviceName: string;
  taskDefinitionArn: string;
  targetGroupArn: string;
  useCodeDeploy?: boolean;
}

export class BlueGreenStack extends cdk.Stack {
  public readonly greenService?: ecs.FargateService;
  public readonly blueGreenDeployment?: codedeploy.EcsDeploymentGroup;

  constructor(scope: Construct, id: string, props: BlueGreenStackProps) {
    super(scope, id, props);

    const {
      projectName,
      environment,
      clusterName,
      serviceName,
      taskDefinitionArn,
      targetGroupArn,
      useCodeDeploy = false,
    } = props;

    const cluster = ecs.Cluster.fromClusterName(this, 'Cluster', clusterName);
    const targetGroup = elbv2.ApplicationTargetGroup.fromTargetGroupAttributes(
      this,
      'TargetGroup',
      { targetGroupArn }
    );

    if (useCodeDeploy) {
      // CodeDeploy Blue/Green
      const application = new codedeploy.EcsApplication(this, 'Application', {
        applicationName: `${projectName}-app-${environment}`,
      });

      this.blueGreenDeployment = new codedeploy.EcsDeploymentGroup(this, 'DeploymentGroup', {
        application,
        service: ecs.FargateService.fromServiceName(this, 'Service', clusterName, serviceName),
        blueGreenDeploymentConfig: codedeploy.EcsBlueGreenDeploymentConfig.standard({
          blueTargetGroup: targetGroup,
          greenTargetGroup: targetGroup, // In real scenario, create new target group
          listener: elbv2.ApplicationListener.fromLookup(this, 'Listener', {
            loadBalancerArn: targetGroup.loadBalancerArns[0],
          }),
        }),
      });
    } else {
      // Manual Blue/Green - Create green service
      const greenServiceName = `${serviceName}-green`;
      
      // Note: This is a simplified version. Full implementation would:
      // 1. Create new target group for green
      // 2. Create green service
      // 3. Switch traffic gradually
      // 4. Delete blue service after validation
      
      new cdk.CfnOutput(this, 'GreenServiceName', {
        value: greenServiceName,
        description: 'Green service name (to be created manually)',
      });
    }

    new cdk.CfnOutput(this, 'DeploymentType', {
      value: useCodeDeploy ? 'CodeDeploy' : 'Manual',
      description: 'Blue/Green deployment type',
    });
  }
}

