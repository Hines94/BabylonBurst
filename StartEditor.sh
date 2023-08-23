#!/bin/bash

cp .env Engine/Editor/.env
sed -i 's/^/VITE_/' Engine/Editor/.env
cd Engine/Editor
npm run start