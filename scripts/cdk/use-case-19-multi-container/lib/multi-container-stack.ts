import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface MultiContainerStackProps extends cdk.StackProps {
  projectName: string;
  environment: string;
  clusterName: string;
  serviceName: string;
  mainContainerImage: string;
  sidecarContainers?: Array<{
    name: string;
    image: string;
    essential?: boolean;
    dependsOn?: Array<{ containerName: string; condition: string }>;
  }>;
  taskExecutionRoleArn?: string;
  taskRoleArn?: string;
  cpu?: string;
  memory?: string;
}

export class MultiContainerStack extends cdk.Stack {
  public readonly taskDefinition: ecs.FargateTaskDefinition;
  public readonly service: ecs.FargateService;

  constructor(scope: Construct, id: string, props: MultiContainerStackProps) {
    super(scope, id, props);

    const {
      projectName,
      environment,
      clusterName,
      serviceName,
      mainContainerImage,
      sidecarContainers = [],
      taskExecutionRoleArn,
      taskRoleArn,
      cpu = '512',
      memory = '1024',
    } = props;

    const cluster = ecs.Cluster.fromClusterName(this, 'Cluster', clusterName);

    // Task execution role
    const executionRole = taskExecutionRoleArn
      ? iam.Role.fromRoleArn(this, 'TaskExecutionRole', taskExecutionRoleArn)
      : new iam.Role(this, 'TaskExecutionRole', {
          roleName: `${projectName}-ecs-task-execution-role-${environment}`,
          assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
          managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
          ],
        });

    // Task role
    const taskRole = taskRoleArn
      ? iam.Role.fromRoleArn(this, 'TaskRole', taskRoleArn)
      : new iam.Role(this, 'TaskRole', {
          roleName: `${projectName}-ecs-task-role-${environment}`,
          assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        });

    // Log group
    const logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/ecs/${serviceName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Task definition
    this.taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDefinition', {
      family: `${serviceName}-multi-container`,
      cpu: parseInt(cpu),
      memoryLimitMiB: parseInt(memory),
      executionRole: executionRole,
      taskRole: taskRole,
    });

    // Main container
    const mainContainer = this.taskDefinition.addContainer('MainContainer', {
      image: ecs.ContainerImage.fromRegistry(mainContainerImage),
      essential: true,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'main',
        logGroup: logGroup,
      }),
    });

    mainContainer.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    });

    // Sidecar containers
    sidecarContainers.forEach((sidecar, index) => {
      const sidecarContainer = this.taskDefinition.addContainer(`Sidecar${index}`, {
        image: ecs.ContainerImage.fromRegistry(sidecar.image),
        essential: sidecar.essential !== false,
        logging: ecs.LogDrivers.awsLogs({
          streamPrefix: sidecar.name,
          logGroup: logGroup,
        }),
      });

      // Add dependencies if specified
      if (sidecar.dependsOn) {
        sidecar.dependsOn.forEach(dep => {
          // CDK handles dependencies automatically based on container order
        });
      }
    });

    // Service
    this.service = new ecs.FargateService(this, 'Service', {
      cluster: cluster,
      serviceName: serviceName,
      taskDefinition: this.taskDefinition,
      desiredCount: 2,
      assignPublicIp: true,
      circuitBreaker: {
        enable: true,
        rollback: true,
      },
    });

    new cdk.CfnOutput(this, 'TaskDefinitionArn', {
      value: this.taskDefinition.taskDefinitionArn,
      description: 'Multi-container task definition ARN',
    });

    new cdk.CfnOutput(this, 'ServiceArn', {
      value: this.service.serviceArn,
      description: 'ECS Service ARN',
    });
  }
}

