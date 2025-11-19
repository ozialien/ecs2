#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ECSDeploymentStack } from '../lib/ecs-deployment-stack';

const app = new cdk.App();

const projectName = app.node.tryGetContext('project') || 'myapp';
const environment = app.node.tryGetContext('environment') || 'dev';
const region = app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION || 'us-east-1';
const account = app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT;

const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
const uniqueId = app.node.tryGetContext('uniqueId') || timestamp;
const stackName = `${projectName}-06-normal-deployment-${environment}-${uniqueId}`;

if (!account) {
  throw new Error('Account ID must be provided via context or CDK_DEFAULT_ACCOUNT environment variable');
}

new ECSDeploymentStack(app, stackName, {
  env: {
    account: account,
    region: region,
  },
  description: `Normal ECS Deployment (Use Case 6) - ${projectName} - ${environment}`,
  stackName: stackName,
  tags: {
    Project: projectName,
    Environment: environment,
    UseCase: '06-normal-deployment',
    ManagedBy: 'CDK',
  },
  projectName,
  environment,
  clusterName: app.node.tryGetContext('clusterName') || `${projectName}-cluster-${environment}`,
  serviceName: app.node.tryGetContext('serviceName') || `${projectName}-service-${environment}`,
  taskDefinitionFamily: app.node.tryGetContext('taskDefinitionFamily') || projectName,
  containerImage: app.node.tryGetContext('containerImage'),
  containerPort: app.node.tryGetContext('containerPort') || 80,
  cpu: app.node.tryGetContext('cpu') || '256',
  memory: app.node.tryGetContext('memory') || '512',
  desiredCount: app.node.tryGetContext('desiredCount') || 2,
  enableCircuitBreaker: app.node.tryGetContext('enableCircuitBreaker') !== 'false',
  targetGroupArn: app.node.tryGetContext('targetGroupArn'),
  taskExecutionRoleArn: app.node.tryGetContext('taskExecutionRoleArn'),
  taskRoleArn: app.node.tryGetContext('taskRoleArn'),
});

