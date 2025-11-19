#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MultiContainerStack } from '../lib/multi-container-stack';

const app = new cdk.App();

const projectName = app.node.tryGetContext('project') || 'myapp';
const environment = app.node.tryGetContext('environment') || 'dev';
const region = app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION || 'us-east-1';
const account = app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT;


const uniqueId = app.node.tryGetContext('uniqueId');
const baseStackName = `${projectName}-19-multi-container-${environment}`;
const stackName = app.node.tryGetContext('''stackName''') || (uniqueId ? `${baseStackName}-${uniqueId}` : baseStackName);

if (!account) {
  throw new Error('Account ID must be provided');
}

new MultiContainerStack(app, stackName, {
  env: { account, region },
  description: `Multi-Container Task Definition (Use Case 19) - ${projectName} - ${environment}`,
  stackName,
  tags: { Project: projectName, Environment: environment, UseCase: '19-multi-container', ManagedBy: 'CDK' },
  projectName,
  environment,
  clusterName: app.node.tryGetContext('clusterName'),
  serviceName: app.node.tryGetContext('serviceName'),
  mainContainerImage: app.node.tryGetContext('mainContainerImage'),
  sidecarContainers: app.node.tryGetContext('sidecarContainers') ? JSON.parse(app.node.tryGetContext('sidecarContainers')) : [],
  taskExecutionRoleArn: app.node.tryGetContext('taskExecutionRoleArn'),
  taskRoleArn: app.node.tryGetContext('taskRoleArn'),
  cpu: app.node.tryGetContext('cpu') || '512',
  memory: app.node.tryGetContext('memory') || '1024',
});

