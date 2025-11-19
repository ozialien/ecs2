#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ECSExecStack } from '../lib/ecs-exec-stack';

const app = new cdk.App();

const projectName = app.node.tryGetContext('project') || 'myapp';
const environment = app.node.tryGetContext('environment') || 'dev';
const region = app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION || 'us-east-1';
const account = app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT;

const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
const uniqueId = app.node.tryGetContext('uniqueId') || timestamp;
const stackName = `${projectName}-18-ecs-exec-${environment}-${uniqueId}`;

if (!account) {
  throw new Error('Account ID must be provided');
}

new ECSExecStack(app, stackName, {
  env: { account, region },
  description: `ECS Exec (Use Case 18) - ${projectName} - ${environment}`,
  stackName,
  tags: { Project: projectName, Environment: environment, UseCase: '18-ecs-exec', ManagedBy: 'CDK' },
  projectName,
  environment,
  clusterName: app.node.tryGetContext('clusterName'),
  serviceName: app.node.tryGetContext('serviceName'),
  enableExec: app.node.tryGetContext('enableExec') !== 'false',
});

