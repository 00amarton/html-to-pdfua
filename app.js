const express = require('express');
const PDFDocument = require('pdfkit');
const { JSDOM } = require('jsdom');
const { HtmlValidate } = require('html-validate');
const path = require('path');
const MatterhornValidator = require('./matterhorn-validator');

// Configurazione ambiente JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Funzione di validazione HTML con suggerimenti
function validateHTML(html) {
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const suggestions = [];

    // Controllo lingua nel tag <html>
    if (!document.documentElement.hasAttribute('lang')) {
        suggestions.push({
            message: 'Specifica la lingua del documento nel tag <html> (es. <html lang="it">).'
        });
    }

    // Controllo immagini senza attributo alt
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
        if (!img.hasAttribute('alt')) {
            suggestions.push({
                message: `L'immagine ${index + 1} manca dell'attributo 'alt'.`
            });
        }
    });

    return {
        isValid: suggestions.length === 0,
        suggestions
    };
}

class PDFUAGenerator {
    constructor() {
        this.doc = new PDFDocument({
            tagged: true,
            lang: 'it-IT',
            displayTitle: true,
            pdfVersion: '1.7'
        });
    }

    async generatePDFUA(html) {
        try {
            // Configura metadati PDF/UA
            this.doc.info = {
                Title: 'Documento PDF/UA',
                Author: 'HTML to PDF/UA Converter',
                Subject: 'Documento accessibile',
                Keywords: 'PDF/UA, accessibilità',
                Creator: 'PDFKit Converter',
                Producer: 'PDF/UA Generator',
                Language: 'it-IT'
            };

            const virtualDom = new JSDOM(html);
            const body = virtualDom.window.document.body;
            await this.processNode(body);
            
            return this.doc;
        } catch (error) {
            console.error('Errore dettagliato:', error);
            throw new Error(`Errore nella generazione PDF/UA: ${error.message}`);
        }
    }

    async processNode(node) {
        try {
            if (node.nodeType === 3) { // Text node
                const text = node.textContent.trim();
                if (text) {
                    this.doc.text(text + ' ');
                }
                return;
            }

            const tagName = node.nodeName.toLowerCase();
            
            switch(tagName) {
                case 'h1':
                    this.doc.fontSize(24);
                    break;
                case 'h2':
                    this.doc.fontSize(20);
                    break;
                default:
                    this.doc.fontSize(12);
            }

            if (node.childNodes) {
                for (const child of node.childNodes) {
                    await this.processNode(child);
                }
            }
        } catch (error) {
            console.error('Errore nel processamento del nodo:', error);
            throw error;
        }
    }
}

// Endpoint di validazione HTML con suggerimenti
app.post('/validate', (req, res) => {
    try {
        const { html } = req.body;
        if (!html) throw new Error('HTML non fornito.');

        const validationResults = validateHTML(html);
        res.json(validationResults);

    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            details: 'Errore durante la validazione HTML'
        });
    }
});

app.post('/convert', async (req, res) => {
    try {
        const { html } = req.body;
        if (!html) {
            throw new Error('HTML non fornito');
        }

        // Prima valida con Matterhorn
        const validationResult = await MatterhornValidator.validateDocument(html);
        
        if (!validationResult.isValid) {
            return res.status(400).json({
                error: 'Documento non conforme a PDF/UA',
                validationResults: validationResult.results
            });
        }

        // Se la validazione passa, procedi con la conversione
        const generator = new PDFUAGenerator();
        const doc = await generator.generatePDFUA(html);
        
        res.contentType('application/pdf');
        doc.pipe(res);
        doc.end();

    } catch (error) {
        console.error('Errore:', error);
        res.status(500).json({
            error: error.message,
            details: 'Errore nella generazione o validazione del PDF/UA'
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server PDF/UA attivo sulla porta ${port}`);
});
