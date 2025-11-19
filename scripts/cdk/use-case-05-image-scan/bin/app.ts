#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ImageScanStack } from '../lib/image-scan-stack';

const app = new cdk.App();

const projectName = app.node.tryGetContext('project') || 'myapp';
const environment = app.node.tryGetContext('environment') || 'dev';
const region = app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION || 'us-east-1';
const account = app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT;


const uniqueId = app.node.tryGetContext('uniqueId');
const baseStackName = `${projectName}-05-image-scan-${environment}`;
const stackName = app.node.tryGetContext(''stackName'') || (uniqueId ? `${baseStackName}-${uniqueId}` : baseStackName);

if (!account) {
  throw new Error('Account ID must be provided');
}

new ImageScanStack(app, stackName, {
  env: { account, region },
  description: `Image Scan (Use Case 5) - ${projectName} - ${environment}`,
  stackName,
  tags: { Project: projectName, Environment: environment, UseCase: '05-image-scan', ManagedBy: 'CDK' },
  projectName,
  environment,
  ecrRepositoryName: app.node.tryGetContext('ecrRepositoryName'),
  enableContinuousScan: app.node.tryGetContext('enableContinuousScan') === 'true',
});

