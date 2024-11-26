#!/usr/bin/env bash

# Debug mode
set -x

# Fail on error
set -e

# Install system dependencies for PDF processing
echo "Installing system dependencies..."
apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libpixman-1-dev

# Install node dependencies
echo "Installing Node.js dependencies..."
npm install

# Create required directories
echo "Setting up directories..."
mkdir -p public/temp

# Set permissions
echo "Setting permissions..."
chmod -R 755 public

echo "Build completed successfully"