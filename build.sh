#!/usr/bin/env bash

# Make sure scripts are executable
chmod +x build.sh

# Install dependencies
npm install --production

# Create public directory if it doesn't exist
mkdir -p public/css public/js

# Copy static files if they exist
if [ -d "src/public" ]; then
  cp -r src/public/* public/
fi

echo "Build completed successfully"