#!/bin/bash

cd() {
    builtin cd "$@" || { echo "Failed to change directory" >&2; exit 1; }
}

cp .env Engine/Editor/.env || exit
sed -i 's/^/VITE_/' Engine/Editor/.env
cd Engine/Editor
npm run start