#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BatchJobStack } from '../lib/batch-job-stack';

const app = new cdk.App();

const projectName = app.node.tryGetContext('project') || 'myapp';
const environment = app.node.tryGetContext('environment') || 'dev';
const region = app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION || 'us-east-1';
const account = app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT;

const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
const uniqueId = app.node.tryGetContext('uniqueId') || timestamp;
const stackName = `${projectName}-15-batch-job-${environment}-${uniqueId}`;

if (!account) {
  throw new Error('Account ID must be provided');
}

new BatchJobStack(app, stackName, {
  env: { account, region },
  description: `Batch Job Scheduling (Use Case 15) - ${projectName} - ${environment}`,
  stackName,
  tags: { Project: projectName, Environment: environment, UseCase: '15-batch-job', ManagedBy: 'CDK' },
  projectName,
  environment,
  clusterName: app.node.tryGetContext('clusterName'),
  taskDefinitionArn: app.node.tryGetContext('taskDefinitionArn'),
  scheduleExpression: app.node.tryGetContext('scheduleExpression') || 'cron(0 2 * * ? *)',
  jobName: app.node.tryGetContext('jobName') || `${projectName}-batch-job-${environment}`,
});

