const express = require('express');
const PDFDocument = require('pdfkit');
const { JSDOM } = require('jsdom');
const axeCore = require('axe-core');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

class PDFUAGenerator {
    constructor() {
        this.doc = new PDFDocument({
            tagged: true,
            lang: 'it-IT',
            displayTitle: true,
            pdfVersion: '1.7'
        });
        this.setupPDFUA();
    }

    setupPDFUA() {
        // Metadati PDF/UA obbligatori
        this.doc.info = {
            Title: 'Documento PDF/UA',
            Author: 'HTML to PDF/UA Converter',
            Subject: 'Documento PDF/UA accessibile',
            Keywords: 'PDF/UA, accessibilità, WCAG 2.1',
            Creator: 'PDF/UA Converter',
            Producer: 'PDFKit con estensioni UA',
            Trapped: '/Unknown',
            'PDF/UA Identifier': '1',
            'PDF/UA Conformance': 'Purpose = Accessibility, Conformance = UA1'
        };

        // Impostazioni di accessibilità
        this.doc.catalog.lang = 'it-IT';
        this.doc.catalog.pageLayout = 'OneColumn';
        this.doc.catalog.pageMode = 'UseOutlines';
    }

    async validateHTML(html) {
        const dom = new JSDOM(html);
        const results = await axeCore.run(dom.window.document);
        return results.violations.length === 0;
    }

    processNode(node, parentTag = 'P') {
        if (node.nodeType === 3) { // Text node
            return node.textContent.trim();
        }

        let content = '';
        const nodeName = node.nodeName.toLowerCase();

        // Mappa tag HTML a struttura PDF/UA
        const tagMap = {
            'h1': 'H1',
            'h2': 'H2',
            'h3': 'H3',
            'p': 'P',
            'ul': 'L',
            'li': 'LI',
            'a': 'Link',
            'strong': 'Strong',
            'em': 'Em'
        };

        const tag = tagMap[nodeName] || parentTag;

        // Gestione speciale per liste e elementi di lista
        if (nodeName === 'ul' || nodeName === 'ol') {
            this.doc.structure.list(() => {
                Array.from(node.children).forEach(li => {
                    this.doc.structure.listItem(() => {
                        this.processNode(li, 'LI');
                    });
                });
            });
        } else {
            // Gestione generale altri elementi
            for (let child of node.childNodes) {
                content += this.processNode(child, tag) + ' ';
            }
        }

        return content.trim();
    }

    async generatePDF(html) {
        if (!await this.validateHTML(html)) {
            throw new Error('HTML non conforme agli standard di accessibilità');
        }

        const dom = new JSDOM(html);
        this.doc.structure.document(() => {
            this.processNode(dom.window.document.body);
        });

        return this.doc;
    }
}

app.post('/convert', async (req, res) => {
    try {
        const { html } = req.body;
        if (!html) throw new Error('HTML non fornito');

        const generator = new PDFUAGenerator();
        const doc = await generator.generatePDF(html);
        
        res.contentType('application/pdf');
        doc.pipe(res);
        doc.end();

    } catch (error) {
        console.error('Errore conversione PDF/UA:', error);
        res.status(500).json({ 
            error: error.message,
            details: 'Errore nella generazione PDF/UA'
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
