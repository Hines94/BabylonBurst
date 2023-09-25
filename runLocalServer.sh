#!/bin/bash

# Check if Jekyll is installed
if ! command -v jekyll &> /dev/null
then
    sudo apt-get install ruby-full build-essential zlib1g-dev
    echo '# Install Ruby Gems to ~/gems' >> ~/.bashrc
    echo 'export GEM_HOME="$HOME/gems"' >> ~/.bashrc
    echo 'export PATH="$HOME/gems/bin:$PATH"' >> ~/.bashrc
    source ~/.bashrc
    gem install jekyll bundler
fi

# Install the gems from the Gemfile.
bundle install

# Serve your Jekyll site locally.
bundle exec jekyll serve
