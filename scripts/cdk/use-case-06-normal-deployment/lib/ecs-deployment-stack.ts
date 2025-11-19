import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface ECSDeploymentStackProps extends cdk.StackProps {
  projectName: string;
  environment: string;
  clusterName: string;
  serviceName: string;
  taskDefinitionFamily: string;
  containerImage: string;
  containerPort?: number;
  cpu?: string;
  memory?: string;
  desiredCount?: number;
  enableCircuitBreaker?: boolean;
  targetGroupArn?: string;
  taskExecutionRoleArn?: string;
  taskRoleArn?: string;
}

export class ECSDeploymentStack extends cdk.Stack {
  public readonly service: ecs.FargateService;
  public readonly taskDefinition: ecs.FargateTaskDefinition;

  constructor(scope: Construct, id: string, props: ECSDeploymentStackProps) {
    super(scope, id, props);

    const {
      projectName,
      environment,
      clusterName,
      serviceName,
      taskDefinitionFamily,
      containerImage,
      containerPort = 80,
      cpu = '256',
      memory = '512',
      desiredCount = 2,
      enableCircuitBreaker = true,
      targetGroupArn,
      taskExecutionRoleArn,
      taskRoleArn,
    } = props;

    // Import existing cluster
    const cluster = ecs.Cluster.fromClusterName(this, 'Cluster', clusterName);

    // Import or create task execution role
    const executionRole = taskExecutionRoleArn
      ? iam.Role.fromRoleArn(this, 'TaskExecutionRole', taskExecutionRoleArn)
      : new iam.Role(this, 'TaskExecutionRole', {
          roleName: `${projectName}-ecs-task-execution-role-${environment}`,
          assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
          managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
          ],
        });

    // Import or create task role
    const taskRole = taskRoleArn
      ? iam.Role.fromRoleArn(this, 'TaskRole', taskRoleArn)
      : new iam.Role(this, 'TaskRole', {
          roleName: `${projectName}-ecs-task-role-${environment}`,
          assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        });

    // CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/ecs/${taskDefinitionFamily}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Task Definition
    this.taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDefinition', {
      family: taskDefinitionFamily,
      cpu: parseInt(cpu),
      memoryLimitMiB: parseInt(memory),
      executionRole: executionRole,
      taskRole: taskRole,
    });

    // Container Definition
    const container = this.taskDefinition.addContainer('Container', {
      image: ecs.ContainerImage.fromRegistry(containerImage),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'ecs',
        logGroup: logGroup,
      }),
      healthCheck: {
        command: ['CMD-SHELL', `curl -f http://localhost:${containerPort}/health || exit 1`],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    container.addPortMappings({
      containerPort: containerPort,
      protocol: ecs.Protocol.TCP,
    });

    // Service
    const serviceProps: ecs.FargateServiceProps = {
      cluster: cluster,
      serviceName: serviceName,
      taskDefinition: this.taskDefinition,
      desiredCount: desiredCount,
      assignPublicIp: true,
      enableExecuteCommand: false,
      circuitBreaker: enableCircuitBreaker
        ? {
            enable: true,
            rollback: true,
          }
        : undefined,
    };

    // Add load balancer if target group ARN provided
    if (targetGroupArn) {
      const targetGroup = elbv2.ApplicationTargetGroup.fromTargetGroupAttributes(
        this,
        'TargetGroup',
        {
          targetGroupArn: targetGroupArn,
        }
      );

      this.service = new ecs.FargateService(this, 'Service', {
        ...serviceProps,
        loadBalancers: [
          {
            containerName: 'Container',
            containerPort: containerPort,
            targetGroup: targetGroup,
          },
        ],
      });
    } else {
      this.service = new ecs.FargateService(this, 'Service', serviceProps);
    }

    // Outputs
    new cdk.CfnOutput(this, 'ServiceName', {
      value: this.service.serviceName,
      description: 'ECS Service Name',
    });

    new cdk.CfnOutput(this, 'ServiceArn', {
      value: this.service.serviceArn,
      description: 'ECS Service ARN',
    });

    new cdk.CfnOutput(this, 'TaskDefinitionArn', {
      value: this.taskDefinition.taskDefinitionArn,
      description: 'Task Definition ARN',
    });
  }
}

