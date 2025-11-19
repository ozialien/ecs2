#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EmergencyHotfixStack } from '../lib/emergency-hotfix-stack';

const app = new cdk.App();

const projectName = app.node.tryGetContext('project') || 'myapp';
const environment = app.node.tryGetContext('environment') || 'dev';
const region = app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION || 'us-east-1';
const account = app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT;


const uniqueId = app.node.tryGetContext('uniqueId');
const baseStackName = `${projectName}-07-emergency-hotfix-${environment}`;
const stackName = app.node.tryGetContext('''stackName''') || (uniqueId ? `${baseStackName}-${uniqueId}` : baseStackName);

if (!account) {
  throw new Error('Account ID must be provided');
}

new EmergencyHotfixStack(app, stackName, {
  env: { account, region },
  description: `Emergency Hotfix (Use Case 7) - ${projectName} - ${environment}`,
  stackName,
  tags: { Project: projectName, Environment: environment, UseCase: '07-emergency-hotfix', ManagedBy: 'CDK' },
  projectName,
  environment,
  clusterName: app.node.tryGetContext('clusterName'),
  serviceName: app.node.tryGetContext('serviceName'),
  hotfixImageUri: app.node.tryGetContext('hotfixImageUri'),
  hotfixTag: app.node.tryGetContext('hotfixTag') || `hotfix-${new Date().toISOString().split('T')[0]}`,
});

