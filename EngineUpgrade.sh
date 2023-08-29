#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
MAGENTA='\033[0;35m'
RESET='\033[0m'

# Ensure the script stops if any command fails
set -e

# Step 1: Check for clean state
if [[ -n $(git status -s) ]]; then
  echo -e ${RED}"Your project has uncommitted changes. Please commit or stash them before proceeding."${RESET}
  exit 1
fi

# Check if the engine's remote exists, if not, add it
if ! git ls-remote engine-upstream > /dev/null 2>&1; then
    echo "Adding engine's GitHub repository as 'engine-upstream' remote temporarily..."
    git remote add engine-upstream https://github.com/Hines94/BabylonBoost.git
else
    echo "'engine-upstream' remote already exists. Using it temporarily for the upgrade..."
fi

# Backup the Source folder
BACKUP_DIR="Source_backup_$(date +'%Y%m%d_%H%M%S')"
echo "Backing up 'Source' directory to '$BACKUP_DIR'..."
cp -R Source "$BACKUP_DIR"

# Fetch the latest changes from engine-upstream
echo "Fetching the latest changes from engine-upstream..."
git fetch engine-upstream

# Restore the Source folder from the backup
echo "Restoring your 'Source' directory..."
rm -rf Source
mv "$BACKUP_DIR" Source

# Merge the changes from the engine-upstream's main branch into the user's current branch
echo "Merging changes from the latest engine version into your branch..."
git merge engine-upstream/main

# Restore the Source folder from the backup
echo "Restoring your 'Source' directory..."
rm -rf Source
mv "$BACKUP_DIR" Source

# Remove the engine-upstream remote
echo "Removing temporary 'engine-upstream' remote..."
git remote remove engine-upstream

# Complete!
echo -e ${MAGENTA}"Upgrade complete! If you encounter any merge conflicts, resolve them. After ensuring everything works, you can push to your own repository."${RESET}
