const express = require('express');
const PDFDocument = require('pdfkit');
const { JSDOM } = require('jsdom');
const fetch = require('node-fetch');
const FormData = require('form-data');
const axeCore = require('axe-core');
const { HtmlValidate } = require('html-validate');
const multer = require('multer');
const path = require('path');

// Configurazione del validatore HTML
const htmlValidator = new HtmlValidate({
    rules: {
        'wcag/h37': 'error',
        'wcag/h67': 'error',
        'element-required-attributes': 'error'
    }
});

class PDFUAGenerator {
    constructor() {
        this.doc = new PDFDocument({
            tagged: true,
            lang: 'it-IT',
            displayTitle: true,
            pdfVersion: '1.7',
            documentStructure: true
        });
    }

    async validateHTML(html) {
        // Validazione HTML con html-validate
        const htmlResult = await htmlValidator.validateString(html);
        if (!htmlResult.valid) {
            throw new Error(`Errori HTML: ${JSON.stringify(htmlResult.messages)}`);
        }

        // Validazione accessibilità con axe-core
        const dom = new JSDOM(html);
        const axeResults = await axeCore.run(dom.window.document);
        if (axeResults.violations.length > 0) {
            throw new Error(`Violazioni accessibilità: ${JSON.stringify(axeResults.violations)}`);
        }

        return true;
    }

    async generatePDFUA(html) {
        try {
            // Valida HTML prima della conversione
            await this.validateHTML(html);

            // Configura metadati PDF/UA
            this.doc.info = {
                Title: 'Documento PDF/UA',
                Author: 'HTML to PDF/UA Converter',
                Subject: 'Documento accessibile conforme PDF/UA',
                Keywords: 'PDF/UA, accessibilità, ISO 14289-1',
                Creator: 'PDFKit Converter',
                Producer: 'PDF/UA Generator',
                Language: 'it-IT',
                'PDF/UA Identifier': '1',
                AccessibilityCompliant: 'true',
                TaggedPDF: 'true'
            };

            // Processa il contenuto HTML
            const dom = new JSDOM(html);
            await this.processNode(dom.window.document.body);
            
            return this.doc;
        } catch (error) {
            throw new Error(`Errore nella generazione PDF/UA: ${error.message}`);
        }
    }

    async processNode(node) {
        if (node.nodeType === 3) { // Text node
            this.doc.text(node.textContent.trim());
            return;
        }

        const tagName = node.nodeName.toLowerCase();
        switch(tagName) {
            case 'h1':
                this.doc.structure.heading(1, () => {
                    this.doc.fontSize(24).text(node.textContent.trim());
                });
                break;

            case 'h2':
                this.doc.structure.heading(2, () => {
                    this.doc.fontSize(20).text(node.textContent.trim());
                });
                break;

            case 'p':
                this.doc.structure.paragraph(() => {
                    this.doc.fontSize(12).text(node.textContent.trim());
                });
                break;

            case 'ul':
            case 'ol':
                this.doc.structure.list(() => {
                    Array.from(node.children).forEach(li => {
                        this.doc.structure.listItem(() => {
                            this.doc.fontSize(12).text(li.textContent.trim());
                        });
                    });
                });
                break;

            case 'table':
                this.doc.structure.table(() => {
                    // Gestione tabelle accessibili
                    Array.from(node.rows).forEach(row => {
                        this.doc.structure.tableRow(() => {
                            Array.from(row.cells).forEach(cell => {
                                this.doc.structure.tableCell(() => {
                                    this.doc.text(cell.textContent.trim());
                                });
                            });
                        });
                    });
                });
                break;

            default:
                // Processa nodi figli ricorsivamente
                for (const child of node.childNodes) {
                    await this.processNode(child);
                }
        }
    }
}

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint per la conversione
app.post('/convert', async (req, res) => {
    try {
        const { html } = req.body;
        if (!html) {
            throw new Error('HTML non fornito');
        }

        const generator = new PDFUAGenerator();
        const doc = await generator.generatePDFUA(html);

        res.contentType('application/pdf');
        doc.pipe(res);
        doc.end();

    } catch (error) {
        console.error('Errore:', error);
        res.status(500).json({
            error: error.message,
            details: 'Errore nella generazione del PDF/UA'
        });
    }
});

// Route principale
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server PDF/UA attivo sulla porta ${port}`);
});
