#!/bin/bash

# Check if Jekyll is installed
if ! command -v jekyll &> /dev/null
then
    # Update system
    sudo apt-get update -y && sudo apt-get upgrade -y
    
    # Install Ruby
    sudo apt-get install ruby-full build-essential zlib1g-dev -y
    
    # Set up Environment Variables for Ruby
    echo '# Install Ruby Gems to ~/gems' >> ~/.bashrc
    echo 'export GEM_HOME="$HOME/gems"' >> ~/.bashrc
    echo 'export PATH="$HOME/gems/bin:$PATH"' >> ~/.bashrc
    source ~/.bashrc
    
    # Install Jekyll and Bundler
    gem install jekyll bundler --user-install
fi

# Check if bundle is installed
if ! command -v bundle &> /dev/null
then
    # If not installed, install bundle
    gem install bundler --user-install
fi

# Serve your Jekyll site locally
bundle exec jekyll serve
