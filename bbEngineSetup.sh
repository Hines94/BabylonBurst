#!/bin/bash

# Function to print messages in cyan
print_cyan() {
    echo -e "\e[36m$1\e[0m"
}

base_path="$(cd "$(dirname "$0")" && pwd)"
cd ${base_path}

# The actual script
clear
print_cyan "--- Starting setup for Babylon Boost ---\n"

# Install modules common to all packages
print_cyan "--- Installing Common Modules ---\n"
npm install

print_cyan "--- Installing Engine Modules ---\n"
cd Engine/Client || exit
npm install
cd ${base_path}
cd Engine/Editor
npm install
cd ${base_path}
cd Engine/Server
bash DevSetup.sh
cd ${base_path}

print_cyan "--- Installing git hooks for Engine ---\n"
mkdir ${base_path}/.git/hooks
cp ${base_path}/Engine/Tools/GitHooks/pre-commit ${base_path}/.git/hooks/pre-commit
chmod +x ${base_path}/.git/hooks/pre-commit

print_cyan "--- Babylon Boost setup complete! ---\n"
read -r -p "Press any key to continue..." key
