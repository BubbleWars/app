#!/bin/bash

# Set your repository details and tag
REPO="ultimateurinater/bubblewars-sepolia"
TAG="latest"

# Function to tag and push Docker image
tag_and_push_docker_image() {
  local image_id=$1
  
  # Tag the Docker image
  docker tag "$image_id" "$REPO:$TAG"
  if [ $? -ne 0 ]; then
    echo "Failed to tag the Docker image."
    exit 1
  fi
  echo "Tagged image $image_id as $REPO:$TAG"
  
  # Push the Docker image to the specified repository
  docker push "$REPO:$TAG"
  if [ $? -ne 0 ]; then
    echo "Failed to push the Docker image."
    exit 1
  fi
  echo "Pushed image $REPO:$TAG to the repository."
}

# Check if the necessary argument is provided
if [ $# -ne 1 ]; then
  echo "Usage: $0 <image_id>"
  exit 1
fi

IMAGE_ID=$1

# Tag and push the Docker image
tag_and_push_docker_image "$IMAGE_ID"
