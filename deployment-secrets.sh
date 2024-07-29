#!/bin/bash

# Check if user is logged in
if ! gh auth status > /dev/null 2>&1; then
  echo "You are not logged in to GitHub CLI. Please log in first."
  gh auth login
  if ! gh auth status > /dev/null 2>&1; then
    echo "Login failed. Exiting."
    exit 1
  fi
fi

# Function to set secrets from .env file
set_secrets_from_env_file() {
  local env_file=$1
  local repo=$2
  
  while IFS= read -r line; do
    if [[ ! "$line" =~ ^#.*$ && "$line" == *"="* ]]; then
      local secret_name=$(echo "$line" | cut -d '=' -f 1)
      local secret_value=$(echo "$line" | cut -d '=' -f 2-)
      gh secret set "$secret_name" --body "$secret_value" --repo "$repo"
      echo "Set secret: $secret_name"
      echo "Value: $secret_value"
    fi
  done < "$env_file"
}

# Set your repository details
REPO="BubbleWars/app"

# Check if the .env file is provided
if [ -z "$1" ]; then
  echo "Usage: $0 path_to_env_file"
  exit 1
fi

ENV_FILE=$1

# Set secrets from the provided .env file
set_secrets_from_env_file "$ENV_FILE" "$REPO"

echo "All secrets have been set successfully."
