const express = require('express');
const PDFDocument = require('pdfkit-ua');
const { JSDOM } = require('jsdom');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

async function createAccessiblePDF(html) {
    const doc = new PDFDocument({
        pdfVersion: '1.7',
        tagged: true,
        lang: 'it-IT',
        displayTitle: true,
        documentStructure: true
    });

    // Metadati PDF/UA
    doc.setMetadata({
        'dc:title': 'Documento PDF/UA',
        'dc:creator': 'HTML to PDF/UA Converter',
        'dc:language': 'it-IT',
        'pdf:producer': 'PDFKit-UA',
        'pdf:trapped': 'Unknown',
        'xmp:createDate': new Date().toISOString(),
        'pdfua': '1',
        'pdfuaVersion': '1',
        'accessibilityCompliant': true
    });

    // Inizia la struttura del documento
    doc.structure.document(() => {
        // Aggiunge informazioni di conformità PDF/UA
        doc.structure.documentFragment(() => {
            doc.structure.heading1(() => {
                doc.structure.span('Documento PDF/UA Accessibile');
            });

            // Processa l'HTML e mantiene la struttura
            const dom = new JSDOM(html);
            processNode(dom.window.document.body, doc);
        });
    });

    return doc;
}

function processNode(node, doc) {
    switch(node.nodeName.toLowerCase()) {
        case 'h1':
            doc.structure.heading1(() => {
                doc.text(node.textContent);
            });
            break;
        case 'h2':
            doc.structure.heading2(() => {
                doc.text(node.textContent);
            });
            break;
        case 'p':
            doc.structure.paragraph(() => {
                doc.text(node.textContent);
            });
            break;
        case 'ul':
            doc.structure.list(() => {
                Array.from(node.children).forEach(li => {
                    doc.structure.listItem(() => {
                        doc.text(li.textContent);
                    });
                });
            });
            break;
        default:
            if (node.children) {
                Array.from(node.children).forEach(child => processNode(child, doc));
            } else if (node.textContent.trim()) {
                doc.structure.span(() => {
                    doc.text(node.textContent.trim());
                });
            }
    }
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
            error: error.message,
            details: 'Errore nella creazione del PDF/UA'
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
