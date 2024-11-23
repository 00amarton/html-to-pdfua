const express = require('express');
const PDFDocument = require('pdfkit');
const { JSDOM } = require('jsdom');
const fetch = require('node-fetch');
const FormData = require('form-data');
const axeCore = require('axe-core');
const path = require('path');

class PDFUAValidator {
    static async validateWithVeraPDF(pdfBuffer) {
        const formData = new FormData();
        formData.append('file', pdfBuffer, {
            filename: 'document.pdf',
            contentType: 'application/pdf'
        });

        const response = await fetch('https://verapdf.org/api/validate', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Errore durante la validazione PDF/UA');
        }

        const validationResult = await response.json();
        
        // Verifica conformità PDF/UA
        if (!validationResult.compliant) {
            throw new Error(`PDF non conforme a PDF/UA: ${JSON.stringify(validationResult.details)}`);
        }

        return validationResult;
    }

    static async validateHTML(html) {
        const dom = new JSDOM(html);
        const results = await axeCore.run(dom.window.document);
        
        if (results.violations.length > 0) {
            throw new Error(`Violazioni accessibilità HTML: ${JSON.stringify(results.violations)}`);
        }
        
        return true;
    }
}

class PDFUAGenerator {
    constructor() {
        this.doc = new PDFDocument({
            tagged: true,
            lang: 'it-IT',
            displayTitle: true,
            pdfVersion: '1.7'
        });

        // Imposta metadati PDF/UA
        this.doc.info['PDF/UA-1'] = 'Compliant';
        this.doc.info.Title = 'PDF/UA Document';
        this.doc.info.Creator = 'HTML to PDF/UA Converter';
        this.doc.info.Language = 'it-IT';
    }

    async generatePDF(html) {
        // Valida HTML prima della conversione
        await PDFUAValidator.validateHTML(html);

        const dom = new JSDOM(html);
        await this.processNode(dom.window.document.body);

        // Raccogli il buffer del PDF
        const chunks = [];
        this.doc.on('data', chunk => chunks.push(chunk));
        
        return new Promise((resolve, reject) => {
            this.doc.on('end', async () => {
                const pdfBuffer = Buffer.concat(chunks);
                
                try {
                    // Valida il PDF generato con veraPDF
                    const validationResult = await PDFUAValidator.validateWithVeraPDF(pdfBuffer);
                    resolve({
                        pdf: pdfBuffer,
                        validation: validationResult
                    });
                } catch (error) {
                    reject(error);
                }
            });
            
            this.doc.end();
        });
    }

    async processNode(node) {
        if (node.nodeType === 3) { // Text node
            this.doc.text(node.textContent.trim());
            return;
        }

        const tagName = node.nodeName.toLowerCase();
        
        switch(tagName) {
            case 'h1':
                this.doc.structure.heading(1, async () => {
                    for (const child of node.childNodes) {
                        await this.processNode(child);
                    }
                });
                break;
            
            case 'p':
                this.doc.structure.paragraph(async () => {
                    for (const child of node.childNodes) {
                        await this.processNode(child);
                    }
                });
                break;

            case 'ul':
                this.doc.structure.list(async () => {
                    for (const child of node.childNodes) {
                        if (child.nodeName.toLowerCase() === 'li') {
                            this.doc.structure.listItem(async () => {
                                await this.processNode(child);
                            });
                        }
                    }
                });
                break;

            default:
                for (const child of node.childNodes) {
                    await this.processNode(child);
                }
        }
    }
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/convert', async (req, res) => {
    try {
        const { html } = req.body;
        if (!html) {
            throw new Error('HTML non fornito');
        }

        const generator = new PDFUAGenerator();
        const { pdf, validation } = await generator.generatePDF(html);

        res.contentType('application/pdf');
        res.send(pdf);

    } catch (error) {
        console.error('Errore nella conversione:', error);
        res.status(500).json({
            error: error.message,
            details: 'Errore nella creazione o validazione del PDF/UA'
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server PDF/UA con validazione veraPDF attivo sulla porta ${port}`);
});
