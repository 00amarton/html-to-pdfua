const express = require('express');
const PDFDocument = require('pdfkit');
const { JSDOM } = require('jsdom');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Verifica esistenza cartella public
const publicPath = path.join(__dirname, 'public');
if (!fs.existsSync(publicPath)) {
    console.error('Cartella public non trovata in:', publicPath);
    fs.mkdirSync(publicPath, { recursive: true });
}

// Verifica esistenza file index.html
const indexPath = path.join(publicPath, 'index.html');
if (!fs.existsSync(indexPath)) {
    console.error('File index.html non trovato in:', indexPath);
}

// Rotta principale
app.get('/', function(req, res) {
    console.log('Directory corrente:', __dirname);
    console.log('Percorso file:', indexPath);
    
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('File index.html non trovato');
    }
});

// API conversione
app.post('/convert', async (req, res) => {
    try {
        const { html } = req.body;
        
        if (!html) {
            throw new Error('HTML non fornito');
        }
        
        // Crea PDF con tag di accessibilità
        const doc = new PDFDocument({
            tagged: true,
            lang: 'it-IT',
            displayTitle: true
        });

        // Imposta metadati PDF/UA
        doc.info['Title'] = 'Documento Accessibile';
        doc.info['Creator'] = 'HTML to PDF/UA Converter';
        doc.info['Producer'] = 'PDFKit';

        // Pipe al response
        res.contentType('application/pdf');
        doc.pipe(res);

        // Processa HTML
        const dom = new JSDOM(html);
        const content = dom.window.document.body.textContent;
        
        doc.text(content);
        doc.end();

    } catch (error) {
        console.error('Errore durante la conversione:', error);
        res.status(500).json({ 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Directory di lavoro:', process.cwd());
    console.log('Directory pubblica:', publicPath);
});
