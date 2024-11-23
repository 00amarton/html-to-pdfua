const express = require('express');
const PDFDocument = require('pdfkit');
const { JSDOM } = require('jsdom');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function createAccessiblePDF(html) {
    const doc = new PDFDocument({
        tagged: true,
        lang: 'it-IT',
        displayTitle: true
    });

    // Imposta metadati per accessibilità
    doc.info.Title = 'Documento Accessibile';
    doc.info.Author = 'HTML to PDF Converter';
    doc.info.Subject = 'Documento PDF accessibile';
    doc.info.Keywords = 'accessibile, pdf, converter';
    doc.info.Creator = 'PDF Converter';
    doc.info.Producer = 'PDFKit';

    // Processa HTML
    const dom = new JSDOM(html);
    const content = processContent(dom.window.document.body);
    doc.text(content);

    return doc;
}

function processContent(node) {
    let content = '';
    
    if (node.nodeType === 3) { // Text node
        return node.textContent.trim();
    }

    for (let child of node.childNodes) {
        content += processContent(child) + ' ';
    }

    return content.trim();
}

app.post('/convert', async (req, res) => {
    try {
        const { html } = req.body;
        
        if (!html) {
            throw new Error('HTML non fornito');
        }

        const doc = await createAccessiblePDF(html);
        
        res.contentType('application/pdf');
        doc.pipe(res);
        doc.end();

    } catch (error) {
        console.error('Errore durante la conversione:', error);
        res.status(500).json({ 
            error: error.message
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
