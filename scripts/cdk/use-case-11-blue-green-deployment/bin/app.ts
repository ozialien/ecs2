#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BlueGreenStack } from '../lib/blue-green-stack';

const app = new cdk.App();

const projectName = app.node.tryGetContext('project') || 'myapp';
const environment = app.node.tryGetContext('environment') || 'dev';
const region = app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION || 'us-east-1';
const account = app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT;


const uniqueId = app.node.tryGetContext('uniqueId');
const baseStackName = `${projectName}-11-blue-green-deployment-${environment}`;
const stackName = app.node.tryGetContext('''stackName''') || (uniqueId ? `${baseStackName}-${uniqueId}` : baseStackName);

if (!account) {
  throw new Error('Account ID must be provided');
}

new BlueGreenStack(app, stackName, {
  env: { account, region },
  description: `Blue/Green Deployment (Use Case 11) - ${projectName} - ${environment}`,
  stackName,
  tags: { Project: projectName, Environment: environment, UseCase: '11-blue-green', ManagedBy: 'CDK' },
  projectName,
  environment,
  clusterName: app.node.tryGetContext('clusterName'),
  serviceName: app.node.tryGetContext('serviceName'),
  taskDefinitionArn: app.node.tryGetContext('taskDefinitionArn'),
  targetGroupArn: app.node.tryGetContext('targetGroupArn'),
  useCodeDeploy: app.node.tryGetContext('useCodeDeploy') === 'true',
});

