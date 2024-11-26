#!/usr/bin/env bash
# Crea la directory public se non esiste
mkdir -p public

# Copia i file statici
cp -r src/public/* public/

# Installa le dipendenze
npm install

# Permessi di esecuzione per i file necessari
chmod +x build.sh