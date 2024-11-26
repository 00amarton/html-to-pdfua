#!/usr/bin/env bash

# Debug: mostra i comandi mentre vengono eseguiti
set -x

# Assicurati che il fail avvenga se qualche comando fallisce
set -e

# Installa le dipendenze
echo "Installing dependencies..."
npm install

# Crea directory public se non esiste
echo "Creating public directory..."
mkdir -p public

# Copia i file statici se esistono
if [ -d "src/public" ]; then
  echo "Copying static files..."
  cp -r src/public/* public/
fi

# Verifica che le dipendenze siano state installate
echo "Verifying dependencies..."
if [ ! -d "node_modules" ]; then
  echo "node_modules not found, retrying npm install..."
  rm -rf package-lock.json
  npm install
fi

# Verifica che express sia installato
if [ ! -d "node_modules/express" ]; then
  echo "Express not found, installing specifically..."
  npm install express
fi

echo "Build completed successfully"