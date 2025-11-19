#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { RollbackStack } from '../lib/rollback-stack';

const app = new cdk.App();

const projectName = app.node.tryGetContext('project') || 'myapp';
const environment = app.node.tryGetContext('environment') || 'dev';
const region = app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION || 'us-east-1';
const account = app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT;

const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
const uniqueId = app.node.tryGetContext('uniqueId') || timestamp;
const stackName = `${projectName}-08-rollback-${environment}-${uniqueId}`;

if (!account) {
  throw new Error('Account ID must be provided via context or CDK_DEFAULT_ACCOUNT environment variable');
}

new RollbackStack(app, stackName, {
  env: {
    account: account,
    region: region,
  },
  description: `ECS Rollback (Use Case 8) - ${projectName} - ${environment}`,
  stackName: stackName,
  tags: {
    Project: projectName,
    Environment: environment,
    UseCase: '08-rollback',
    ManagedBy: 'CDK',
  },
  projectName,
  environment,
  clusterName: app.node.tryGetContext('clusterName'),
  serviceName: app.node.tryGetContext('serviceName'),
  previousTaskDefinitionRevision: app.node.tryGetContext('previousTaskDefinitionRevision'),
});

