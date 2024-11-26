const fs = require('fs');
const path = require('path');

async function postInstall() {
    try {
        // Verifica se siamo in ambiente di produzione
        const isProduction = process.env.NODE_ENV === 'production';
        
        if (isProduction) {
            console.log('Configurazione ambiente di produzione...');
            
            // Assicurati che la directory node_modules esista
            if (!fs.existsSync('node_modules')) {
                fs.mkdirSync('node_modules', { recursive: true });
            }

            console.log('Setup completato con successo');
        } else {
            console.log('Ambiente di sviluppo, nessuna configurazione necessaria');
        }
    } catch (error) {
        console.error('Errore durante il postinstall:', error);
        process.exit(1);
    }
}

postInstall().catch(console.error);