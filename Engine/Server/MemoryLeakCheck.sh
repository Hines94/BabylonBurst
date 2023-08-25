#!/bin/sh

# Path to the binary
program="${PWD}/build/server_build/babylonboostserver"

# Ensure the program is built before running Valgrind
./BuildDev.sh

# Run Valgrind
valgrind --leak-check=full $program
