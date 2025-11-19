#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ImageBuildStack } from '../lib/image-build-stack';

const app = new cdk.App();

const projectName = app.node.tryGetContext('project') || 'myapp';
const environment = app.node.tryGetContext('environment') || 'dev';
const region = app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION || 'us-east-1';
const account = app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT;


const uniqueId = app.node.tryGetContext('uniqueId');
const baseStackName = `${projectName}-04-image-build-${environment}`;
const stackName = app.node.tryGetContext(''stackName'') || (uniqueId ? `${baseStackName}-${uniqueId}` : baseStackName);

if (!account) {
  throw new Error('Account ID must be provided');
}

new ImageBuildStack(app, stackName, {
  env: { account, region },
  description: `Image Build (Use Case 4) - ${projectName} - ${environment}`,
  stackName,
  tags: { Project: projectName, Environment: environment, UseCase: '04-image-build', ManagedBy: 'CDK' },
  projectName,
  environment,
  ecrRepositoryUri: app.node.tryGetContext('ecrRepositoryUri'),
  sourceLocation: app.node.tryGetContext('sourceLocation'),
  dockerfilePath: app.node.tryGetContext('dockerfilePath') || 'Dockerfile',
});

