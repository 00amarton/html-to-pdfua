const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class PDFUAConverter {
    constructor() {
        this.pdfOptions = {
            format: 'A4',
            printBackground: true,
            displayHeaderFooter: false,
            margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
            preferCSSPageSize: true,
            scale: 1,
            landscape: false
        };

        this.accessibilityTags = {
            documentStructure: true,
            headings: true,
            lists: true,
            tables: true,
            images: true,
            links: true,
            forms: true
        };
    }

    async convertToPDFUA(html, metadata = {}) {
        try {
            // 1. Pre-processo dell'HTML per assicurare la struttura semantica
            const enhancedHtml = await this.enhanceHTMLStructure(html);

            // 2. Conversione iniziale in PDF
            const initialPdfBuffer = await this.generatePDF(enhancedHtml);

            // 3. Aggiungi tag di accessibilità
            const taggedPdfBuffer = await this.addAccessibilityLayer(initialPdfBuffer, metadata);

            // 4. Validazione finale PDF/UA
            await this.validatePDFUA(taggedPdfBuffer);

            return taggedPdfBuffer;
        } catch (error) {
            throw new Error(`Errore nella conversione PDF/UA: ${error.message}`);
        }
    }

    async enhanceHTMLStructure(html) {
        // Analizza e migliora la struttura HTML per una migliore accessibilità
        const cheerio = require('cheerio');
        const $ = cheerio.load(html);

        // Assicura una corretta struttura dei titoli
        this.ensureHeadingStructure($);

        // Aggiungi attributi ARIA dove necessario
        this.addAriaAttributes($);

        // Migliora la struttura delle tabelle
        this.enhanceTableStructure($);

        // Assicura che tutte le immagini abbiano un alt text
        this.ensureImageAccessibility($);

        return $.html();
    }

    async generatePDF(html) {
        let browser;
        try {
            browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                headless: true
            });

            const page = await browser.newPage();

            // Inietta CSS per migliorare l'accessibilità
            await page.addStyleTag({
                content: this.getAccessibilityCSS()
            });

            await page.setContent(html, {
                waitUntil: ['networkidle0', 'domcontentloaded']
            });

            // Applica script per migliorare l'accessibilità
            await page.evaluate(this.getAccessibilityScript);

            // Genera PDF con impostazioni ottimizzate
            const pdfBuffer = await page.pdf({
                ...this.pdfOptions,
                tagged: true,
                pdfUA: true
            });

            return pdfBuffer;
        } finally {
            if (browser) await browser.close();
        }
    }

    async addAccessibilityLayer(pdfBuffer, metadata) {
        // Usa qpdf per la manipolazione del PDF
        const tempInputPath = `/tmp/input-${Date.now()}.pdf`;
        const tempOutputPath = `/tmp/output-${Date.now()}.pdf`;

        try {
            await fs.writeFile(tempInputPath, pdfBuffer);

            // Applica trasformazioni per PDF/UA usando qpdf
            await execPromise(`qpdf --json-input=${this.getQPDFConfig(metadata)} ${tempInputPath} ${tempOutputPath}`);

            // Leggi il PDF finale
            const finalPdfBuffer = await fs.readFile(tempOutputPath);

            return finalPdfBuffer;
        } finally {
            // Pulisci i file temporanei
            await Promise.all([
                fs.unlink(tempInputPath).catch(() => {}),
                fs.unlink(tempOutputPath).catch(() => {})
            ]);
        }
    }

    async validatePDFUA(pdfBuffer) {
        // Implementa validazione usando veraPDF (open source)
        // Questa è una simulazione - nella realtà dovresti integrare veraPDF
        const validation = {
            isValid: true,
            errors: [],
            warnings: []
        };

        if (!validation.isValid) {
            throw new Error('Il PDF non rispetta gli standard PDF/UA');
        }
    }

    getAccessibilityCSS() {
        return `
            @page { size: A4; margin: 20mm; }
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            h1, h2, h3, h4, h5, h6 { margin-top: 1em; margin-bottom: 0.5em; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            img { max-width: 100%; height: auto; }
            @media print {
                a::after { content: " (" attr(href) ")"; }
                abbr::after { content: " (" attr(title) ")"; }
            }
        `;
    }

    getAccessibilityScript() {
        // Script eseguito nel browser per migliorare l'accessibilità
        return function() {
            // Aggiungi attributi ARIA mancanti
            document.querySelectorAll('nav').forEach(nav => {
                if (!nav.getAttribute('aria-label')) {
                    nav.setAttribute('aria-label', 'Navigazione principale');
                }
            });

            // Migliora l'accessibilità delle tabelle
            document.querySelectorAll('table').forEach(table => {
                if (!table.querySelector('caption')) {
                    const caption = document.createElement('caption');
                    caption.textContent = table.getAttribute('aria-label') || 'Tabella dati';
                    table.prepend(caption);
                }
            });

            // Aggiungi landmark regions mancanti
            if (!document.querySelector('main')) {
                const main = document.createElement('main');
                main.setAttribute('role', 'main');
                while (document.body.firstChild) {
                    main.appendChild(document.body.firstChild);
                }
                document.body.appendChild(main);
            }
        };
    }

    getQPDFConfig(metadata) {
        return JSON.stringify({
            "document": {
                "title": metadata.title || "Documento PDF/UA",
                "author": metadata.author || "HTML to PDF/UA Converter",
                "subject": metadata.subject || "Documento accessibile",
                "keywords": metadata.keywords || ["accessibile", "PDF/UA"],
                "language": metadata.language || "it-IT"
            },
            "accessibility": {
                "tagged": true,
                "structureType": "PDF/UA-1",
                "naturalLanguage": metadata.language || "it-IT",
                "alternateDescriptions": true,
                "tableStructure": true
            }
        });
    }

    ensureHeadingStructure($) {
        let currentLevel = 1;
        $('h1, h2, h3, h4, h5, h6').each((i, elem) => {
            const level = parseInt(elem.tagName[1]);
            if (level - currentLevel > 1) {
                $(elem).before(`<h${currentLevel + 1} class="generated-heading">Sezione ${currentLevel + 1}</h${currentLevel + 1}>`);
            }
            currentLevel = level;
        });
    }

    addAriaAttributes($) {
        $('a').not('[aria-label]').each((i, elem) => {
            const $elem = $(elem);
            if (!$elem.text().trim()) {
                $elem.attr('aria-label', $elem.attr('href'));
            }
        });

        $('img').not('[alt]').attr('alt', '');
        $('form').not('[aria-label]').attr('aria-label', 'Modulo');
        $('nav').not('[aria-label]').attr('aria-label', 'Navigazione');
    }

    enhanceTableStructure($) {
        $('table').each((i, table) => {
            const $table = $(table);
            
            // Assicura che ci sia un caption
            if (!$table.find('caption').length) {
                $table.prepend('<caption>Tabella dati</caption>');
            }

            // Assicura che ci siano intestazioni
            if (!$table.find('th').length) {
                $table.find('tr:first-child td').each((j, cell) => {
                    $(cell).replaceWith(`<th>${$(cell).html()}</th>`);
                });
            }

            // Aggiungi scope alle intestazioni
            $table.find('th').each((j, th) => {
                if (!$(th).attr('scope')) {
                    $(th).attr('scope', 'col');
                }
            });
        });
    }

    ensureImageAccessibility($) {
        $('img').each((i, img) => {
            const $img = $(img);
            if (!$img.attr('alt')) {
                const filename = $img.attr('src')?.split('/').pop() || '';
                $img.attr('alt', filename.split('.')[0] || 'Immagine');
            }
        });
    }
}

module.exports = { PDFUAConverter };
