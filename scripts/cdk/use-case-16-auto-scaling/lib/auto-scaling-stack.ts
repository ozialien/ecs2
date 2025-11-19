import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as applicationautoscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

export interface AutoScalingStackProps extends cdk.StackProps {
  projectName: string;
  environment: string;
  clusterName: string;
  serviceName: string;
  minCapacity?: number;
  maxCapacity?: number;
  targetCpuUtilization?: number;
  targetMemoryUtilization?: number;
  scaleInCooldown?: number;
  scaleOutCooldown?: number;
}

export class AutoScalingStack extends cdk.Stack {
  public readonly scalableTarget: applicationautoscaling.ScalableTarget;
  public readonly cpuScalingPolicy: applicationautoscaling.TargetTrackingScalingPolicy;
  public readonly memoryScalingPolicy: applicationautoscaling.TargetTrackingScalingPolicy;

  constructor(scope: Construct, id: string, props: AutoScalingStackProps) {
    super(scope, id, props);

    const {
      clusterName,
      serviceName,
      minCapacity = 1,
      maxCapacity = 10,
      targetCpuUtilization = 70,
      targetMemoryUtilization = 80,
      scaleInCooldown = 300,
      scaleOutCooldown = 60,
    } = props;

    const cluster = ecs.Cluster.fromClusterName(this, 'Cluster', clusterName);
    const service = ecs.FargateService.fromServiceName(this, 'Service', cluster, serviceName);

    // Scalable Target
    this.scalableTarget = service.autoScaleTaskCount({
      minCapacity,
      maxCapacity,
    });

    // CPU-based scaling
    this.cpuScalingPolicy = this.scalableTarget.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: targetCpuUtilization,
      scaleInCooldown: cdk.Duration.seconds(scaleInCooldown),
      scaleOutCooldown: cdk.Duration.seconds(scaleOutCooldown),
    });

    // Memory-based scaling
    this.memoryScalingPolicy = this.scalableTarget.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: targetMemoryUtilization,
      scaleInCooldown: cdk.Duration.seconds(scaleInCooldown),
      scaleOutCooldown: cdk.Duration.seconds(scaleOutCooldown),
    });

    // Outputs
    new cdk.CfnOutput(this, 'ScalableTargetId', {
      value: this.scalableTarget.scalableTargetId,
      description: 'Auto Scaling Scalable Target ID',
    });

    new cdk.CfnOutput(this, 'MinCapacity', {
      value: minCapacity.toString(),
      description: 'Minimum task count',
    });

    new cdk.CfnOutput(this, 'MaxCapacity', {
      value: maxCapacity.toString(),
      description: 'Maximum task count',
    });
  }
}

