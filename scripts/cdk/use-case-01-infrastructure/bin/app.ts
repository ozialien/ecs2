#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ECSInfrastructureStack } from '../lib/ecs-infrastructure-stack';

// Get context values with defaults
const app = new cdk.App();

const projectName = app.node.tryGetContext('project') || 'myapp';
const environment = app.node.tryGetContext('environment') || 'dev';
const region = app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION || 'us-east-1';
const account = app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT;

// Generate unique stack name to prevent clashes
const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
const uniqueId = app.node.tryGetContext('uniqueId') || timestamp;
const stackName = `${projectName}-01-infrastructure-${environment}-${uniqueId}`;

// Validate required context
if (!account) {
  throw new Error('Account ID must be provided via context or CDK_DEFAULT_ACCOUNT environment variable');
}

new ECSInfrastructureStack(app, stackName, {
  env: {
    account: account,
    region: region,
  },
  description: `ECS Infrastructure Provisioning (Use Case 1) - ${projectName} - ${environment}`,
  stackName: stackName,
  tags: {
    Project: projectName,
    Environment: environment,
    UseCase: '01-infrastructure',
    ManagedBy: 'CDK',
  },
  // Stack-specific configuration
  projectName,
  environment,
  // VPC Configuration
  vpcCidr: app.node.tryGetContext('vpcCidr') || '10.0.0.0/16',
  enableNatGateway: app.node.tryGetContext('enableNatGateway') !== 'false',
  // ECS Configuration
  clusterName: app.node.tryGetContext('clusterName') || `${projectName}-cluster-${environment}`,
  enableContainerInsights: app.node.tryGetContext('enableContainerInsights') !== 'false',
  // Load Balancer Configuration
  enableLoadBalancer: app.node.tryGetContext('enableLoadBalancer') !== 'false',
  loadBalancerType: app.node.tryGetContext('loadBalancerType') || 'application',
  // Service Discovery
  enableServiceDiscovery: app.node.tryGetContext('enableServiceDiscovery') === 'true',
  serviceDiscoveryNamespace: app.node.tryGetContext('serviceDiscoveryNamespace') || `${projectName}.local`,
});

