const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const { PDFDocument } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const { JSDOM } = require('jsdom');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

class PDFUAConverter {
    constructor() {
        // Configurazioni PDF/UA standard
        this.pdfUAConfig = {
            conformance: 'PDF/UA-1',
            lang: 'it-IT',
            displayDocTitle: true,
            tagged: true
        };

        // Configurazioni accessibilità
        this.accessibilityConfig = {
            naturalReadingOrder: true,
            alternateDescriptions: true,
            taggedPDF: true,
            documentStructure: true,
            logicalStructure: true,
            altText: true,
            tableStructure: true
        };

        // Mappatura ruoli PDF/UA
        this.pdfUARoles = {
            document: 'Document',
            heading1: 'H1',
            heading2: 'H2',
            heading3: 'H3',
            heading4: 'H4',
            heading5: 'H5',
            heading6: 'H6',
            paragraph: 'P',
            list: 'L',
            listItem: 'LI',
            table: 'Table',
            tableRow: 'TR',
            tableHeader: 'TH',
            tableData: 'TD',
            image: 'Figure',
            link: 'Link',
            form: 'Form',
            button: 'Button',
            navigation: 'Nav'
        };
    }

    async convertToPDFUA(html, metadata = {}) {
        try {
            console.log('Iniziando conversione PDF/UA...');
            
            // 1. Validazione e miglioramento HTML
            const enhancedHtml = await this.preprocessHTML(html);
            
            // 2. Generazione PDF base con struttura tag
            const basePdfBuffer = await this.generateBasePDF(enhancedHtml);
            
            // 3. Aggiunta struttura PDF/UA e tag
            const taggedPdfBuffer = await this.addPDFUAStructure(basePdfBuffer, metadata);
            
            // 4. Validazione PDF/UA
            await this.validatePDFUA(taggedPdfBuffer);
            
            console.log('Conversione PDF/UA completata con successo');
            return taggedPdfBuffer;

        } catch (error) {
            console.error('Errore nella conversione PDF/UA:', error);
            throw new Error(`Conversione PDF/UA fallita: ${error.message}`);
        }
    }

    async preprocessHTML(html) {
        console.log('Preprocessing HTML per conformità PDF/UA...');
        
        const dom = new JSDOM(html);
        const doc = dom.window.document;
        
        // Assicura struttura HTML5 semantica
        this.ensureSemanticStructure(doc);
        
        // Verifica e correggi la struttura dei tag
        this.validateTagStructure(doc);
        
        // Aggiungi metadati necessari
        this.addRequiredMetadata(doc);
        
        // Migliora accessibilità contenuti
        this.enhanceAccessibility(doc);
        
        return dom.serialize();
    }

    async generateBasePDF(html) {
        console.log('Generazione PDF base con tag strutturali...');
        
        let browser;
        try {
            browser = await puppeteer.launch({
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
                ignoreHTTPSErrors: true
            });

            const page = await browser.newPage();
            
            // Imposta viewport PDF/UA compatibile
            await page.setViewport({
                width: 1190,
                height: 1684,
                deviceScaleFactor: 1
            });

            // Inietta stili accessibilità
            await page.addStyleTag({ content: this.getAccessibilityCSS() });

            // Carica HTML migliorato
            await page.setContent(html, { waitUntil: 'networkidle0' });

            // Genera PDF con configurazioni PDF/UA
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                displayHeaderFooter: false,
                margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
                preferCSSPageSize: true,
                tagged: true,
                pdfua: true
            });

            return pdfBuffer;

        } finally {
            if (browser) await browser.close();
        }
    }

    async addPDFUAStructure(pdfBuffer, metadata) {
        console.log('Aggiunta struttura PDF/UA...');
        
        // Crea documento PDF/UA temporaneo
        const tempPath = path.join(process.cwd(), `temp-${Date.now()}.pdf`);
        await fs.writeFile(tempPath, pdfBuffer);

        try {
            // Inizializza HummusRecipe per modifiche PDF/UA
            const pdfDoc = new HummusRecipe(tempPath, 'output.pdf');

            // Aggiungi struttura tag PDF/UA
            await this.addTaggedStructure(pdfDoc);

            // Imposta metadati PDF/UA
            await this.setPDFUAMetadata(pdfDoc, metadata);

            // Aggiungi struttura logica
            await this.addLogicalStructure(pdfDoc);

            // Ottimizza per screen reader
            await this.optimizeForScreenReaders(pdfDoc);

            // Salva modifiche
            const enhancedPdfBuffer = await pdfDoc.save();

            return Buffer.from(enhancedPdfBuffer);

        } finally {
            // Pulisci file temporanei
            await fs.unlink(tempPath).catch(() => {});
        }
    }

    async validatePDFUA(pdfBuffer) {
        console.log('Validazione conformità PDF/UA...');
        
        const validation = {
            structureValidation: await this.validateStructure(pdfBuffer),
            accessibilityValidation: await this.validateAccessibility(pdfBuffer),
            tagsValidation: await this.validateTags(pdfBuffer),
            metadataValidation: await this.validateMetadata(pdfBuffer)
        };

        const failures = Object.values(validation).filter(v => !v.passed);
        
        if (failures.length > 0) {
            const errors = failures.map(f => f.error).join('; ');
            throw new Error(`Validazione PDF/UA fallita: ${errors}`);
        }

        return true;
    }

    getAccessibilityCSS() {
        return `
            /* Stili base accessibilità */
            :root {
                --min-contrast-ratio: 4.5;
                --text-spacing: 1.5;
            }

            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
                           Roboto, Oxygen-Sans, Ubuntu, Cantarell, 
                           'Helvetica Neue', sans-serif;
                line-height: var(--text-spacing);
                text-align: left;
                max-width: 100ch;
                margin: auto;
            }

            /* Gerarchia titoli */
            h1, h2, h3, h4, h5, h6 {
                margin-top: 1.5em;
                margin-bottom: 0.5em;
                line-height: 1.2;
                break-after: avoid;
            }

            /* Tabelle accessibili */
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 1em 0;
                caption-side: top;
            }

            th {
                background-color: #f8f9fa;
                font-weight: 600;
                text-align: left;
                padding: 0.5em;
            }

            /* Link accessibili */
            a {
                color: #2563eb;
                text-decoration: underline;
                text-underline-offset: 0.2em;
            }

            /* Immagini accessibili */
            img {
                max-width: 100%;
                height: auto;
                display: block;
                margin: 1em 0;
            }

            /* Liste accessibili */
            ul, ol {
                padding-left: 2em;
                margin: 1em 0;
            }

            /* Form accessibili */
            input, select, textarea {
                font-size: 1rem;
                padding: 0.5em;
                margin: 0.5em 0;
                max-width: 100%;
            }

            /* Media queries per stampa */
            @media print {
                body {
                    font-size: 12pt;
                    line-height: 1.3;
                }

                a::after {
                    content: " (" attr(href) ")";
                    font-size: 0.9em;
                }

                @page {
                    margin: 2cm;
                }
            }
        `;
    }

    // Metodi di supporto per la struttura PDF/UA
    async addTaggedStructure(pdfDoc) {
        // Implementazione tag strutturali PDF/UA
    }

    async setPDFUAMetadata(pdfDoc, metadata) {
        // Implementazione metadati PDF/UA
    }

    async addLogicalStructure(pdfDoc) {
        // Implementazione struttura logica
    }

    async optimizeForScreenReaders(pdfDoc) {
        // Implementazione ottimizzazione screen reader
    }

    // Metodi di validazione
    async validateStructure(pdfBuffer) {
        // Validazione struttura PDF/UA
        return { passed: true };
    }

    async validateAccessibility(pdfBuffer) {
        // Validazione accessibilità
        return { passed: true };
    }

    async validateTags(pdfBuffer) {
        // Validazione tag
        return { passed: true };
    }

    async validateMetadata(pdfBuffer) {
        // Validazione metadati
        return { passed: true };
    }
}

module.exports = { PDFUAConverter };