import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface BatchJobStackProps extends cdk.StackProps {
  projectName: string;
  environment: string;
  clusterName: string;
  taskDefinitionArn: string;
  scheduleExpression: string;
  jobName: string;
}

export class BatchJobStack extends cdk.Stack {
  public readonly rule: events.Rule;

  constructor(scope: Construct, id: string, props: BatchJobStackProps) {
    super(scope, id, props);

    const {
      clusterName,
      taskDefinitionArn,
      scheduleExpression,
      jobName,
    } = props;

    const cluster = ecs.Cluster.fromClusterName(this, 'Cluster', clusterName);

    // EventBridge Rule for scheduled task
    this.rule = new events.Rule(this, 'ScheduleRule', {
      ruleName: `${jobName}-schedule`,
      schedule: events.Schedule.expression(scheduleExpression),
      description: `Scheduled ECS task for ${jobName}`,
    });

    // IAM role for EventBridge to run ECS tasks
    const eventRole = new iam.Role(this, 'EventRole', {
      assumedBy: new iam.ServicePrincipal('events.amazonaws.com'),
    });

    eventRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ecs:RunTask',
        ],
        resources: [taskDefinitionArn],
      })
    );

    eventRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'iam:PassRole',
        ],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'iam:PassedToService': 'ecs-tasks.amazonaws.com',
          },
        },
      })
    );

    // Add ECS task as target
    this.rule.addTarget(
      new targets.EcsTask({
        cluster,
        taskDefinition: ecs.TaskDefinition.fromTaskDefinitionArn(this, 'TaskDef', taskDefinitionArn),
        taskCount: 1,
      })
    );

    new cdk.CfnOutput(this, 'RuleArn', {
      value: this.rule.ruleArn,
      description: 'EventBridge Rule ARN',
    });

    new cdk.CfnOutput(this, 'ScheduleExpression', {
      value: scheduleExpression,
      description: 'Schedule expression',
    });
  }
}

