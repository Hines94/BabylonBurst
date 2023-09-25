#!/bin/bash

# Check if docsify is installed
if ! command -v docsify &> /dev/null
then
    echo "docsify-cli is not installed. Installing..."
    sudo npm install -g docsify-cli --unsafe-perm
fi

# Serve docsify documentation
docsify serve docs -p 4000
