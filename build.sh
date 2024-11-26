#!/usr/bin/env bash

# Debug mode
set -x

# Fail on error
set -e

# Install node dependencies
echo "Installing Node.js dependencies..."
npm install --production --legacy-peer-deps

# Create required directories
echo "Setting up directories..."
mkdir -p public/temp

# Set permissions
echo "Setting permissions..."
chmod -R 755 public

echo "Build completed successfully"