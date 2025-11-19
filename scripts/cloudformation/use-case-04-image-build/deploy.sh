#!/bin/bash
# Image Build Script

set -euo pipefail

PROJECT_NAME="${1:-myapp}"
ENVIRONMENT="${2:-dev}"
ECR_REPO_URI="${3:-}"
IMAGE_TAG="${4:-latest}"
DOCKERFILE="${5:-Dockerfile}"

if [ -z "$ECR_REPO_URI" ]; then
  echo "Usage: $0 <project> <env> <ecr-repo-uri> [image-tag] [dockerfile]"
  exit 1
fi

AWS_REGION="${AWS_REGION:-us-east-1}"

log_info() { echo -e "\033[0;32m[INFO]\033[0m $1"; }

log_info "Logging in to ECR..."
aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${ECR_REPO_URI}"

log_info "Building Docker image..."
docker build -t "${ECR_REPO_URI}:${IMAGE_TAG}" -f "${DOCKERFILE}" .

if [ "$IMAGE_TAG" != "latest" ]; then
  log_info "Tagging as latest..."
  docker tag "${ECR_REPO_URI}:${IMAGE_TAG}" "${ECR_REPO_URI}:latest"
fi

log_info "Pushing image to ECR..."
docker push "${ECR_REPO_URI}:${IMAGE_TAG}"
docker push "${ECR_REPO_URI}:latest"

log_info "Image build and push completed: ${ECR_REPO_URI}:${IMAGE_TAG}"

