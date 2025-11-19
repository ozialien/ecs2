#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RollingDeploymentStack } from '../lib/rolling-deployment-stack';

const app = new cdk.App();

const projectName = app.node.tryGetContext('project') || 'myapp';
const environment = app.node.tryGetContext('environment') || 'dev';
const region = app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION || 'us-east-1';
const account = app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT;

const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
const uniqueId = app.node.tryGetContext('uniqueId') || timestamp;
const stackName = `${projectName}-13-rolling-deployment-${environment}-${uniqueId}`;

if (!account) {
  throw new Error('Account ID must be provided');
}

new RollingDeploymentStack(app, stackName, {
  env: { account, region },
  description: `Rolling Deployment (Use Case 13) - ${projectName} - ${environment}`,
  stackName,
  tags: { Project: projectName, Environment: environment, UseCase: '13-rolling-deployment', ManagedBy: 'CDK' },
  projectName,
  environment,
  clusterName: app.node.tryGetContext('clusterName'),
  serviceName: app.node.tryGetContext('serviceName'),
  taskDefinitionArn: app.node.tryGetContext('taskDefinitionArn'),
  maximumPercent: app.node.tryGetContext('maximumPercent') || 200,
  minimumHealthyPercent: app.node.tryGetContext('minimumHealthyPercent') || 50,
});

