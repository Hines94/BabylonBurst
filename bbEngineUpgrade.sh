#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
MAGENTA='\033[0;35m'
RESET='\033[0m'

# Ensure the script stops if any command fails
set -e

# Get the directory of the script
SCRIPT_DIR="$(dirname "$0")"

# Step 1: Check for clean state
if [[ -n $(git -C "$SCRIPT_DIR" status -s) ]]; then
  echo -e ${RED}"Your project has uncommitted changes. Please commit or stash them before proceeding."${RESET}
  exit 1
fi

# Create a temporary directory for the clone
TEMP_DIR=$(mktemp -d -t engine_upgrade_XXXXXX)
echo "Temporary directory for clone: $TEMP_DIR"

# Clone the remote repository to the temporary directory
echo "Cloning engine's GitHub repository to temporary directory..."
git clone https://github.com/Hines94/BabylonBoost.git "$TEMP_DIR"

# Copy all files and directories, excluding the specified ones, to the script's directory
echo "Copying contents, excluding specified files, to the script's directory..."
rsync -av --progress "$TEMP_DIR/" "$SCRIPT_DIR/" \
      --exclude .env.sample \
      --exclude LICENSE \
      --exclude README.md \
      --exclude CONTRIBUTING.md \
      --exclude Source/

# Clean up by removing the temporary directory
rm -rf "$TEMP_DIR"

# Complete!
echo -e ${MAGENTA}"Upgrade complete! Your directory has been updated, excluding the specified files and the 'Source' folder."${RESET}
