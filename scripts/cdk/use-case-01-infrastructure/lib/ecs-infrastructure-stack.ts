import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface ECSInfrastructureStackProps extends cdk.StackProps {
  projectName: string;
  environment: string;
  vpcCidr?: string;
  enableNatGateway?: boolean;
  clusterName: string;
  enableContainerInsights?: boolean;
  enableLoadBalancer?: boolean;
  loadBalancerType?: 'application' | 'network';
  enableServiceDiscovery?: boolean;
  serviceDiscoveryNamespace?: string;
}

export class ECSInfrastructureStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly cluster: ecs.Cluster;
  public readonly taskExecutionRole: iam.Role;
  public readonly taskRole: iam.Role;
  public readonly loadBalancer?: elbv2.ApplicationLoadBalancer | elbv2.NetworkLoadBalancer;
  public readonly targetGroup?: elbv2.ApplicationTargetGroup | elbv2.NetworkTargetGroup;
  public readonly serviceDiscoveryNamespace?: servicediscovery.PrivateDnsNamespace;

  constructor(scope: Construct, id: string, props: ECSInfrastructureStackProps) {
    super(scope, id, props);

    const {
      projectName,
      environment,
      vpcCidr = '10.0.0.0/16',
      enableNatGateway = true,
      clusterName,
      enableContainerInsights = true,
      enableLoadBalancer = true,
      loadBalancerType = 'application',
      enableServiceDiscovery = false,
      serviceDiscoveryNamespace = `${projectName}.local`,
    } = props;

    // ============================================
    // VPC and Networking
    // ============================================
    this.vpc = new ec2.Vpc(this, 'VPC', {
      cidr: vpcCidr,
      maxAzs: 3, // Multi-AZ for high availability
      natGateways: enableNatGateway ? 2 : 0, // NAT Gateways for private subnets
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      tags: {
        Name: `${projectName}-vpc-${environment}`,
        Project: projectName,
        Environment: environment,
      },
    });

    // VPC Endpoints for ECR, S3, CloudWatch Logs (for private subnets)
    // ECR API endpoint
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    // ECR API endpoint
    this.vpc.addInterfaceEndpoint('ECREndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR,
    });

    // ECR Docker endpoint
    this.vpc.addInterfaceEndpoint('ECRDockerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
    });

    // CloudWatch Logs endpoint
    this.vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
    });

    // ============================================
    // Security Groups
    // ============================================
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'ECSSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for ECS tasks',
      allowAllOutbound: true,
    });

    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    // ============================================
    // IAM Roles
    // ============================================
    // Task Execution Role (for pulling images, writing logs)
    this.taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      roleName: `${projectName}-ecs-task-execution-role-${environment}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
      description: `ECS Task Execution Role for ${projectName} in ${environment}`,
    });

    // Task Role (for application permissions)
    this.taskRole = new iam.Role(this, 'TaskRole', {
      roleName: `${projectName}-ecs-task-role-${environment}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: `ECS Task Role for ${projectName} in ${environment}`,
    });

    // Add CloudWatch Logs permissions to task role
    this.taskRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [`arn:aws:logs:${this.region}:${this.account}:log-group:/ecs/*`],
      })
    );

    // ============================================
    // CloudWatch Logs
    // ============================================
    const logGroup = new logs.LogGroup(this, 'ECSLogGroup', {
      logGroupName: `/ecs/${clusterName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Container Insights Log Group
    const containerInsightsLogGroup = new logs.LogGroup(this, 'ContainerInsightsLogGroup', {
      logGroupName: `/aws/ecs/containerinsights/${clusterName}/performance`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ============================================
    // ECS Cluster
    // ============================================
    this.cluster = new ecs.Cluster(this, 'ECSCluster', {
      clusterName: clusterName,
      vpc: this.vpc,
      containerInsights: enableContainerInsights,
      defaultCloudMapNamespace: enableServiceDiscovery
        ? {
            name: serviceDiscoveryNamespace,
            type: servicediscovery.NamespaceType.DNS_PRIVATE,
            vpc: this.vpc,
          }
        : undefined,
    });

    // ============================================
    // Service Discovery (Optional)
    // ============================================
    if (enableServiceDiscovery) {
      this.serviceDiscoveryNamespace = new servicediscovery.PrivateDnsNamespace(
        this,
        'ServiceDiscoveryNamespace',
        {
          name: serviceDiscoveryNamespace,
          vpc: this.vpc,
        }
      );
    }

    // ============================================
    // Load Balancer (Optional)
    // ============================================
    if (enableLoadBalancer) {
      if (loadBalancerType === 'application') {
        const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
          vpc: this.vpc,
          internetFacing: true,
          securityGroup: albSecurityGroup,
        });

        this.loadBalancer = alb;

        this.targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
          vpc: this.vpc,
          port: 80,
          protocol: elbv2.ApplicationProtocol.HTTP,
          targetType: elbv2.TargetType.IP,
          healthCheck: {
            enabled: true,
            path: '/health',
            interval: cdk.Duration.seconds(30),
            timeout: cdk.Duration.seconds(5),
            healthyHttpCodes: '200',
          },
        });

        alb.addListener('Listener', {
          port: 80,
          defaultTargetGroups: [this.targetGroup],
        });
      } else {
        const nlb = new elbv2.NetworkLoadBalancer(this, 'NLB', {
          vpc: this.vpc,
          internetFacing: true,
        });

        this.loadBalancer = nlb;

        this.targetGroup = new elbv2.NetworkTargetGroup(this, 'TargetGroup', {
          vpc: this.vpc,
          port: 80,
          protocol: elbv2.Protocol.TCP,
          targetType: elbv2.TargetType.IP,
          healthCheck: {
            enabled: true,
            protocol: elbv2.Protocol.TCP,
            interval: cdk.Duration.seconds(30),
            timeout: cdk.Duration.seconds(5),
          },
        });

        nlb.addListener('Listener', {
          port: 80,
          defaultTargetGroups: [this.targetGroup],
        });
      }
    }

    // ============================================
    // Outputs
    // ============================================
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `${projectName}-vpc-id-${environment}`,
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: this.cluster.clusterName,
      description: 'ECS Cluster Name',
      exportName: `${projectName}-cluster-name-${environment}`,
    });

    new cdk.CfnOutput(this, 'ClusterArn', {
      value: this.cluster.clusterArn,
      description: 'ECS Cluster ARN',
    });

    new cdk.CfnOutput(this, 'TaskExecutionRoleArn', {
      value: this.taskExecutionRole.roleArn,
      description: 'Task Execution Role ARN',
      exportName: `${projectName}-task-execution-role-arn-${environment}`,
    });

    new cdk.CfnOutput(this, 'TaskRoleArn', {
      value: this.taskRole.roleArn,
      description: 'Task Role ARN',
      exportName: `${projectName}-task-role-arn-${environment}`,
    });

    if (this.loadBalancer) {
      new cdk.CfnOutput(this, 'LoadBalancerArn', {
        value: this.loadBalancer.loadBalancerArn,
        description: 'Load Balancer ARN',
      });

      new cdk.CfnOutput(this, 'LoadBalancerDnsName', {
        value: this.loadBalancer.loadBalancerDnsName,
        description: 'Load Balancer DNS Name',
      });
    }

    if (this.targetGroup) {
      new cdk.CfnOutput(this, 'TargetGroupArn', {
        value: this.targetGroup.targetGroupArn,
        description: 'Target Group ARN',
      });
    }

    if (this.serviceDiscoveryNamespace) {
      new cdk.CfnOutput(this, 'ServiceDiscoveryNamespaceId', {
        value: this.serviceDiscoveryNamespace.namespaceId,
        description: 'Service Discovery Namespace ID',
      });
    }
  }
}

