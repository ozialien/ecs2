#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CICDPipelineStack } from '../lib/cicd-pipeline-stack';

const app = new cdk.App();

const projectName = app.node.tryGetContext('project') || 'myapp';
const environment = app.node.tryGetContext('environment') || 'dev';
const region = app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION || 'us-east-1';
const account = app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT;


const uniqueId = app.node.tryGetContext('uniqueId');
const baseStackName = `${projectName}-03-cicd-pipeline-${environment}`;
const stackName = app.node.tryGetContext('''stackName''') || (uniqueId ? `${baseStackName}-${uniqueId}` : baseStackName);

if (!account) {
  throw new Error('Account ID must be provided via context or CDK_DEFAULT_ACCOUNT environment variable');
}

new CICDPipelineStack(app, stackName, {
  env: {
    account: account,
    region: region,
  },
  description: `CI/CD Pipeline Setup (Use Case 3) - ${projectName} - ${environment}`,
  stackName: stackName,
  tags: {
    Project: projectName,
    Environment: environment,
    UseCase: '03-cicd-pipeline',
    ManagedBy: 'CDK',
  },
  projectName,
  environment,
  sourceRepository: app.node.tryGetContext('sourceRepository') || 'github.com/user/repo',
  sourceBranch: app.node.tryGetContext('sourceBranch') || 'main',
  codeStarConnectionArn: app.node.tryGetContext('codeStarConnectionArn'),
  ecrRepositoryUri: app.node.tryGetContext('ecrRepositoryUri'),
  ecsClusterName: app.node.tryGetContext('ecsClusterName'),
  ecsServiceName: app.node.tryGetContext('ecsServiceName'),
  enableApprovalGate: app.node.tryGetContext('enableApprovalGate') !== 'false',
});

