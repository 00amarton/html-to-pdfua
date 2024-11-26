const { JSDOM } = require('jsdom');
const cheerio = require('cheerio');

class HTMLFixer {
    constructor() {
        this.fixes = {
            documentStructure: {
                fixMissingElements: (doc) => {
                    const html = doc.documentElement;
                    if (!doc.head) {
                        const head = doc.createElement('head');
                        html.insertBefore(head, html.firstChild);
                    }
                    if (!doc.body) {
                        const body = doc.createElement('body');
                        while (html.lastChild && !['head', 'body'].includes(html.lastChild.nodeName.toLowerCase())) {
                            body.insertBefore(html.lastChild, body.firstChild);
                        }
                        html.appendChild(body);
                    }
                },
                fixMainContent: (doc) => {
                    if (!doc.querySelector('main')) {
                        const main = doc.createElement('main');
                        const body = doc.body;
                        while (body.firstChild) {
                            main.appendChild(body.firstChild);
                        }
                        body.appendChild(main);
                    }
                }
            },

            accessibility: {
                fixMissingAltText: (doc) => {
                    doc.querySelectorAll('img:not([alt])').forEach(img => {
                        const filename = img.getAttribute('src')?.split('/').pop() || '';
                        const nameWithoutExt = filename.split('.')[0] || 'immagine';
                        img.setAttribute('alt', nameWithoutExt.replace(/[_-]/g, ' '));
                    });
                },
                fixAriaLabels: (doc) => {
                    // Fix navigation
                    doc.querySelectorAll('nav').forEach(nav => {
                        if (!nav.getAttribute('aria-label')) {
                            nav.setAttribute('aria-label', 'Navigazione principale');
                        }
                    });

                    // Fix forms
                    doc.querySelectorAll('form').forEach(form => {
                        if (!form.getAttribute('aria-label')) {
                            form.setAttribute('aria-label', 'Modulo');
                        }
                    });
                }
            },

            tableStructure: {
                fixTables: (doc) => {
                    doc.querySelectorAll('table').forEach(table => {
                        // Add caption if missing
                        if (!table.querySelector('caption')) {
                            const caption = doc.createElement('caption');
                            caption.textContent = table.getAttribute('aria-label') || 'Tabella dati';
                            table.insertBefore(caption, table.firstChild);
                        }

                        // Fix headers
                        const firstRow = table.querySelector('tr');
                        if (firstRow && !table.querySelector('th')) {
                            firstRow.querySelectorAll('td').forEach(td => {
                                const th = doc.createElement('th');
                                th.setAttribute('scope', 'col');
                                th.innerHTML = td.innerHTML;
                                td.parentNode.replaceChild(th, td);
                            });
                        }

                        // Fix scope attributes
                        table.querySelectorAll('th').forEach(th => {
                            if (!th.getAttribute('scope')) {
                                th.setAttribute('scope', 'col');
                            }
                        });
                    });
                }
            },

            metadata: {
                fixMetadata: (doc) => {
                    const head = doc.head;
                    const requiredMeta = {
                        'description': 'Descrizione del documento',
                        'keywords': 'keywords, parole chiave',
                        'author': 'Autore del documento'
                    };

                    for (const [name, content] of Object.entries(requiredMeta)) {
                        if (!head.querySelector(`meta[name="${name}"]`)) {
                            const meta = doc.createElement('meta');
                            meta.setAttribute('name', name);
                            meta.setAttribute('content', content);
                            head.appendChild(meta);
                        }
                    }

                    // Fix charset
                    if (!head.querySelector('meta[charset]')) {
                        const charset = doc.createElement('meta');
                        charset.setAttribute('charset', 'UTF-8');
                        head.insertBefore(charset, head.firstChild);
                    }

                    // Fix title
                    if (!head.querySelector('title')) {
                        const title = doc.createElement('title');
                        title.textContent = 'Documento';
                        head.appendChild(title);
                    }
                }
            },

            headingStructure: {
                fixHeadings: (doc) => {
                    const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
                    let expectedLevel = 1;
                    
                    headings.forEach(heading => {
                        const currentLevel = parseInt(heading.tagName[1]);
                        
                        if (currentLevel > expectedLevel) {
                            // Inserisci livelli mancanti
                            for (let i = expectedLevel; i < currentLevel; i++) {
                                const newHeading = doc.createElement(`h${i}`);
                                newHeading.textContent = `Sezione ${i}`;
                                heading.parentNode.insertBefore(newHeading, heading);
                            }
                        }
                        
                        expectedLevel = currentLevel + 1;
                    });
                }
            },

            listStructure: {
                fixLists: (doc) => {
                    // Fix unordered lists
                    doc.querySelectorAll('ul').forEach(ul => {
                        Array.from(ul.children).forEach(child => {
                            if (child.tagName.toLowerCase() !== 'li') {
                                const li = doc.createElement('li');
                                li.innerHTML = child.outerHTML;
                                child.parentNode.replaceChild(li, child);
                            }
                        });
                    });

                    // Fix ordered lists
                    doc.querySelectorAll('ol').forEach(ol => {
                        Array.from(ol.children).forEach(child => {
                            if (child.tagName.toLowerCase() !== 'li') {
                                const li = doc.createElement('li');
                                li.innerHTML = child.outerHTML;
                                child.parentNode.replaceChild(li, child);
                            }
                        });
                    });
                }
            },

            languageSupport: {
                fixLanguage: (doc) => {
                    const html = doc.documentElement;
                    if (!html.getAttribute('lang')) {
                        html.setAttribute('lang', 'it');
                    }

                    // Fix elementi con testo in lingua diversa
                    const textNodes = this.getAllTextNodes(doc.body);
                    textNodes.forEach(node => {
                        const text = node.textContent.trim();
                        if (text && this.isLikelyForeignText(text)) {
                            const span = doc.createElement('span');
                            span.setAttribute('lang', this.detectLanguage(text));
                            span.textContent = text;
                            node.parentNode.replaceChild(span, node);
                        }
                    });
                }
            }
        };
    }

    async fixHTML(html) {
        try {
            const dom = new JSDOM(html);
            const doc = dom.window.document;

            // Applica tutte le correzioni
            this.fixes.documentStructure.fixMissingElements(doc);
            this.fixes.documentStructure.fixMainContent(doc);
            this.fixes.accessibility.fixMissingAltText(doc);
            this.fixes.accessibility.fixAriaLabels(doc);
            this.fixes.tableStructure.fixTables(doc);
            this.fixes.metadata.fixMetadata(doc);
            this.fixes.headingStructure.fixHeadings(doc);
            this.fixes.listStructure.fixLists(doc);
            this.fixes.languageSupport.fixLanguage(doc);

            // Pulisci e formatta l'HTML
            const $ = cheerio.load(dom.serialize(), { xmlMode: true });
            return this.formatHTML($.html());
        } catch (error) {
            console.error('Errore durante la correzione HTML:', error);
            throw error;
        }
    }

    formatHTML(html) {
        // Formatta l'HTML in modo leggibile
        return html
            .replace(/>\s+</g, '>\n<')
            .replace(/(<\/?[^>]+>)/g, '$1\n')
            .replace(/\n\s*\n/g, '\n')
            .trim();
    }

    getAllTextNodes(node) {
        const textNodes = [];
        const walker = node.ownerDocument.createTreeWalker(
            node,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let currentNode;
        while (currentNode = walker.nextNode()) {
            textNodes.push(currentNode);
        }
        return textNodes;
    }

    isLikelyForeignText(text) {
        // Implementa la logica per rilevare testo in lingua straniera
        // Questa è una versione semplificata
        return false;
    }

    detectLanguage(text) {
        // Implementa la logica per rilevare la lingua
        // Questa è una versione semplificata
        return 'en';
    }
}

module.exports = { HTMLFixer };