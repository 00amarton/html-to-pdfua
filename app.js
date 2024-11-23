const express = require('express');
const pdfMake = require('pdfmake');
const htmlToPdfMake = require('html-to-pdfmake');
const { JSDOM } = require('jsdom');
const axeCore = require('axe-core');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

class PDFUAConverter {
    constructor() {
        // Configurazione fonts per pdfmake
        const fonts = {
            Roboto: {
                normal: 'node_modules/pdfmake/fonts/Roboto/Roboto-Regular.ttf',
                bold: 'node_modules/pdfmake/fonts/Roboto/Roboto-Medium.ttf',
                italics: 'node_modules/pdfmake/fonts/Roboto/Roboto-Italic.ttf',
                bolditalics: 'node_modules/pdfmake/fonts/Roboto/Roboto-MediumItalic.ttf'
            }
        };
        
        this.printer = new pdfMake(fonts);
    }

    async validateHTML(html) {
        const dom = new JSDOM(html);
        const document = dom.window.document;
        
        // Esegui validazione accessibilità
        const results = await axeCore.run(document);
        if (results.violations.length > 0) {
            console.log('Problemi di accessibilità trovati:', results.violations);
            throw new Error('Il documento non rispetta gli standard di accessibilità');
        }
        return true;
    }

    async convertToPDFUA(html) {
        try {
            // Valida HTML
            await this.validateHTML(html);

            // Converti HTML in formato pdfmake
            const window = new JSDOM('').window;
            const documentDefinition = htmlToPdfMake(html, {window});

            // Aggiungi metadati PDF/UA
            documentDefinition.info = {
                title: 'Documento PDF/UA Accessibile',
                author: 'HTML to PDF/UA Converter',
                subject: 'PDF/UA accessibile',
                keywords: 'PDF/UA, accessibilità, WCAG 2.1',
                producer: 'PDFMake con supporto UA',
                accessibility: true,
                tagged: true,
                lang: 'it-IT',
                pdfUA: '1',
            };

            // Applica stili per accessibilità
            documentDefinition.defaultStyle = {
                font: 'Roboto',
                fontSize: 12,
                lineHeight: 1.5
            };

            // Crea PDF
            const pdfDoc = this.printer.createPdfKitDocument(documentDefinition);
            return pdfDoc;

        } catch (error) {
            console.error('Errore nella conversione:', error);
            throw error;
        }
    }
}

app.post('/convert', async (req, res) => {
    try {
        const { html } = req.body;
        if (!html) throw new Error('HTML non fornito');

        const converter = new PDFUAConverter();
        const pdfDoc = await converter.convertToPDFUA(html);
        
        res.contentType('application/pdf');
        pdfDoc.pipe(res);
        pdfDoc.end();

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
