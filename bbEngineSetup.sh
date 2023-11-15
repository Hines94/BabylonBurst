#!/bin/bash

# Function to print messages in cyan
print_cyan() {
    echo -e "\e[36m$1\e[0m"
}

base_path="$(cd "$(dirname "$0")" && pwd)"
cd ${base_path}

# The actual script
clear
print_cyan "--- Starting setup for Babylon Burst ---\n"

# Install modules common to all packages
print_cyan "--- Installing Common Modules ---\n"
sudo npm install -g bun
npm install

print_cyan "--- Installing Engine Modules ---\n"
cd Engine/Shared || exit
npm install
cd ${base_path}
cd Engine/Client || exit
npm install
cd ${base_path}
cd Engine/Editor
npm install
cd ${base_path}
cd Engine/Server
print_cyan "TODO: Setup server once implemented!"
cd ${base_path}

print_cyan "--- Installing git hooks for Engine ---\n"
mkdir ${base_path}/.git/hooks
cp ${base_path}/Engine/Tools/GitHooks/pre-commit ${base_path}/.git/hooks/pre-commit
chmod +x ${base_path}/.git/hooks/pre-commit

print_cyan "--- Babylon Burst setup complete! ---\n"
