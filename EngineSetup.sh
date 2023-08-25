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
./DevSetup.sh
cd ${base_path}

print_cyan "--- Setting up vscode ---\n"
cp Engine/Tools/vscodeSetup/settings.json .vscode/settings.json
cp Engine/Tools/vscodeSetup/launch.json .vscode/launch.json
cp Engine/Tools/vscodeSetup/tasks.json .vscode/tasks.json

print_cyan "TODO: Install git hooks for Editor\n"

print_cyan "--- Babylon Boost setup complete! ---\n"
read -r -p "Press any key to continue..." key
