#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AutoScalingStack } from '../lib/auto-scaling-stack';

const app = new cdk.App();

const projectName = app.node.tryGetContext('project') || 'myapp';
const environment = app.node.tryGetContext('environment') || 'dev';
const region = app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION || 'us-east-1';
const account = app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT;

const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
const uniqueId = app.node.tryGetContext('uniqueId') || timestamp;
const stackName = `${projectName}-16-auto-scaling-${environment}-${uniqueId}`;

if (!account) {
  throw new Error('Account ID must be provided');
}

new AutoScalingStack(app, stackName, {
  env: { account, region },
  description: `Auto-Scaling (Use Case 16) - ${projectName} - ${environment}`,
  stackName,
  tags: { Project: projectName, Environment: environment, UseCase: '16-auto-scaling', ManagedBy: 'CDK' },
  projectName,
  environment,
  clusterName: app.node.tryGetContext('clusterName'),
  serviceName: app.node.tryGetContext('serviceName'),
  minCapacity: app.node.tryGetContext('minCapacity') || 1,
  maxCapacity: app.node.tryGetContext('maxCapacity') || 10,
  targetCpuUtilization: app.node.tryGetContext('targetCpuUtilization') || 70,
  targetMemoryUtilization: app.node.tryGetContext('targetMemoryUtilization') || 80,
});

