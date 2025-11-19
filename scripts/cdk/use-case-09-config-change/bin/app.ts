#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ConfigChangeStack } from '../lib/config-change-stack';

const app = new cdk.App();

const projectName = app.node.tryGetContext('project') || 'myapp';
const environment = app.node.tryGetContext('environment') || 'dev';
const region = app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION || 'us-east-1';
const account = app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT;


const uniqueId = app.node.tryGetContext('uniqueId');
const baseStackName = `${projectName}-09-config-change-${environment}`;
const stackName = app.node.tryGetContext('''stackName''') || (uniqueId ? `${baseStackName}-${uniqueId}` : baseStackName);

if (!account) {
  throw new Error('Account ID must be provided');
}

new ConfigChangeStack(app, stackName, {
  env: { account, region },
  description: `Config Change (Use Case 9) - ${projectName} - ${environment}`,
  stackName,
  tags: { Project: projectName, Environment: environment, UseCase: '09-config-change', ManagedBy: 'CDK' },
  projectName,
  environment,
  clusterName: app.node.tryGetContext('clusterName'),
  serviceName: app.node.tryGetContext('serviceName'),
  newConfig: app.node.tryGetContext('newConfig') ? JSON.parse(app.node.tryGetContext('newConfig')) : {},
});

