const express = require('express');
const PDFDocument = require('pdfkit');
const { JSDOM } = require('jsdom');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use('/', express.static(path.join(__dirname, 'public')));

// Rotta principale
app.get('/', function(req, res) {
    console.log('Directory corrente:', __dirname);
    console.log('Percorso file:', path.join(__dirname, 'public', 'index.html'));
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API conversione
app.post('/convert', async (req, res) => {
    try {
        const { html } = req.body;
        
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
        res.status(500).json({ error: error.message });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Directory di lavoro:', process.cwd());
});
