#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ECRRepositoryStack } from '../lib/ecr-repository-stack';

const app = new cdk.App();

const projectName = app.node.tryGetContext('project') || 'myapp';
const environment = app.node.tryGetContext('environment') || 'dev';
const region = app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION || 'us-east-1';
const account = app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT;

const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
const uniqueId = app.node.tryGetContext('uniqueId') || timestamp;
const stackName = `${projectName}-02-ecr-repository-${environment}-${uniqueId}`;

if (!account) {
  throw new Error('Account ID must be provided via context or CDK_DEFAULT_ACCOUNT environment variable');
}

new ECRRepositoryStack(app, stackName, {
  env: {
    account: account,
    region: region,
  },
  description: `ECR Repository Setup (Use Case 2) - ${projectName} - ${environment}`,
  stackName: stackName,
  tags: {
    Project: projectName,
    Environment: environment,
    UseCase: '02-ecr-repository',
    ManagedBy: 'CDK',
  },
  projectName,
  environment,
  repositoryName: app.node.tryGetContext('repositoryName') || `${projectName}-${environment}`,
  enableScanOnPush: app.node.tryGetContext('enableScanOnPush') !== 'false',
  enableContinuousScan: app.node.tryGetContext('enableContinuousScan') === 'true',
  imageTagMutability: app.node.tryGetContext('imageTagMutability') || 'MUTABLE',
  lifecyclePolicy: app.node.tryGetContext('lifecyclePolicy') || 'default',
  encryptionType: app.node.tryGetContext('encryptionType') || 'AES256',
  kmsKeyId: app.node.tryGetContext('kmsKeyId'),
  enableCrossRegionReplication: app.node.tryGetContext('enableCrossRegionReplication') === 'true',
  replicationRegions: app.node.tryGetContext('replicationRegions')?.split(',') || [],
});

