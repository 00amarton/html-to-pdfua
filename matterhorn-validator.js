class MatterhornValidator {
  // Sezione 1: Document Tree (1-28)
    static documentTreeValidators = {
        checkDocumentStructure(doc) {
            return {
                '1.1': {
                    description: 'Document uses valid structure elements',
                    validate: () => {
                        const validElements = ['html', 'head', 'body', 'main', 'article', 'section', 'nav', 'aside', 'header', 'footer'];
                        return validElements.every(element => doc.querySelector(element) !== null);
                    }
                },
                '1.2': {
                    description: 'Structure elements properly nested',
                    validate: () => {
                        // Verifica nesting corretto
                        const sections = doc.querySelectorAll('section');
                        return Array.from(sections).every(section => 
                            section.parentElement.matches('main, article, div, body'));
                    }
                },
                '1.3': {
                    description: 'Heading order is logical',
                    validate: () => {
                        const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
                        let lastLevel = 0;
                        return Array.from(headings).every(heading => {
                            const currentLevel = parseInt(heading.tagName[1]);
                            const valid = currentLevel <= lastLevel + 1;
                            lastLevel = currentLevel;
                            return valid;
                        });
                    }
                },
                '1.4': {
                    description: 'No empty structure elements',
                    validate: () => {
                        const structureElements = doc.querySelectorAll('section, article, aside, nav');
                        return Array.from(structureElements).every(element => 
                            element.textContent.trim().length > 0);
                    }
                },
                '1.5': {
                    description: 'Document has title',
                    validate: () => doc.title && doc.title.trim().length > 0
                },
                '1.6': {
                    description: 'Document language specified',
                    validate: () => doc.documentElement.hasAttribute('lang')
                },
                '1.7': {
                    description: 'Content language changes marked',
                    validate: () => {
                        const foreignTexts = doc.querySelectorAll('[lang]:not(html)');
                        return Array.from(foreignTexts).every(element => 
                            element.getAttribute('lang').length === 2 || 
                            element.getAttribute('lang').length === 5);
                    }
                }
            };
        },

        // Sezione 2: Semantica e Ruoli (8-14)
        checkSemantics(doc) {
            return {
                '2.1': {
                    description: 'ARIA roles used appropriately',
                    validate: () => {
                        const elementsWithRoles = doc.querySelectorAll('[role]');
                        const validRoles = ['main', 'navigation', 'banner', 'contentinfo', 'complementary', 'form', 'search', 'region'];
                        return Array.from(elementsWithRoles).every(element => 
                            validRoles.includes(element.getAttribute('role')));
                    }
                },
                '2.2': {
                    description: 'Interactive elements are operable',
                    validate: () => {
                        const interactiveElements = doc.querySelectorAll('button, a, input, select, textarea');
                        return Array.from(interactiveElements).every(element => {
                            if (element.hasAttribute('disabled')) return true;
                            if (element.tagName === 'A') return element.hasAttribute('href');
                            return true;
                        });
                    }
                }
            };
        }
    };

    // Sezione 3: Tabelle (15-21)
    static tableValidators = {
        checkTableStructure(doc) {
            return {
                '3.1': {
                    description: 'Tables have headers',
                    validate: () => {
                        const tables = doc.querySelectorAll('table');
                        return Array.from(tables).every(table => 
                            table.querySelector('th') !== null);
                    }
                },
                '3.2': {
                    description: 'Table headers have scope',
                    validate: () => {
                        const headers = doc.querySelectorAll('th');
                        return Array.from(headers).every(header => 
                            header.hasAttribute('scope'));
                    }
                },
                '3.3': {
                    description: 'Complex tables have ids and headers',
                    validate: () => {
                        const complexTables = doc.querySelectorAll('table[role="grid"]');
                        return Array.from(complexTables).every(table => {
                            const cells = table.querySelectorAll('td');
                            return Array.from(cells).every(cell => 
                                cell.hasAttribute('headers'));
                        });
                    }
                }
            };
        }
    };
  
// Sezione 4: Immagini e Contenuti Non Testuali (22-35)
    static nonTextValidators = {
        checkImages(doc) {
            return {
                '4.1': {
                    description: 'Images have alt text',
                    validate: () => {
                        const images = doc.querySelectorAll('img');
                        return Array.from(images).every(img => 
                            img.hasAttribute('alt'));
                    }
                },
                '4.2': {
                    description: 'Complex images have long descriptions',
                    validate: () => {
                        const complexImages = doc.querySelectorAll('img[role="img"]');
                        return Array.from(complexImages).every(img => 
                            img.hasAttribute('aria-describedby') || 
                            img.hasAttribute('longdesc'));
                    }
                },
                '4.3': {
                    description: 'Decorative images are marked',
                    validate: () => {
                        const decorativeImages = doc.querySelectorAll('img[role="presentation"]');
                        return Array.from(decorativeImages).every(img => 
                            img.getAttribute('alt') === '');
                    }
                }
            };
        }
    };

    // Sezione 5: Collegamenti e Navigazione (36-48)
    static navigationValidators = {
        checkLinks(doc) {
            return {
                '5.1': {
                    description: 'Links have descriptive text',
                    validate: () => {
                        const links = doc.querySelectorAll('a');
                        return Array.from(links).every(link => 
                            link.textContent.trim().length > 0 &&
                            !['click here', 'here', 'more'].includes(link.textContent.trim().toLowerCase()));
                    }
                },
                '5.2': {
                    description: 'Navigation landmarks present',
                    validate: () => {
                        return doc.querySelector('[role="navigation"]') !== null ||
                               doc.querySelector('nav') !== null;
                    }
                },
                '5.3': {
                    description: 'Skip navigation mechanism',
                    validate: () => {
                        return doc.querySelector('a[href^="#main"]') !== null ||
                               doc.querySelector('a[href^="#content"]') !== null;
                    }
                }
            };
        }
    };

    // Sezione 6: Forms e Controlli Interattivi (49-62)
    static formValidators = {
        checkForms(doc) {
            return {
                '6.1': {
                    description: 'Form controls have labels',
                    validate: () => {
                        const formControls = doc.querySelectorAll('input, select, textarea');
                        return Array.from(formControls).every(control => {
                            const id = control.getAttribute('id');
                            return id && doc.querySelector(`label[for="${id}"]`) !== null;
                        });
                    }
                },
                '6.2': {
                    description: 'Required fields identified',
                    validate: () => {
                        const requiredFields = doc.querySelectorAll('[required]');
                        return Array.from(requiredFields).every(field => 
                            field.hasAttribute('aria-required'));
                    }
                },
                '6.3': {
                    description: 'Form validation messages',
                    validate: () => {
                        const forms = doc.querySelectorAll('form');
                        return Array.from(forms).every(form => 
                            form.hasAttribute('novalidate') || 
                            form.querySelector('[aria-errormessage]') !== null);
                    }
                }
            };
        }
    };

    // Sezione 7: Metadati e Proprietà del Documento (63-75)
    static metadataValidators = {
        checkMetadata(doc) {
            return {
                '7.1': {
                    description: 'Document metadata complete',
                    validate: () => {
                        const metaTags = ['description', 'keywords', 'author'];
                        return metaTags.every(tag => 
                            doc.querySelector(`meta[name="${tag}"]`) !== null);
                    }
                },
                '7.2': {
                    description: 'Character encoding specified',
                    validate: () => {
                        return doc.querySelector('meta[charset]') !== null;
                    }
                },
                '7.3': {
                    description: 'Document outline valid',
                    validate: () => {
                        const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
                        let lastLevel = 0;
                        return Array.from(headings).every(heading => {
                            const currentLevel = parseInt(heading.tagName[1]);
                            const valid = currentLevel <= lastLevel + 1;
                            lastLevel = currentLevel;
                            return valid;
                        });
                    }
                }
            };
        }
    };
  
    // Sezione 8: Liste e Strutture di Lista (76-89)
    static listValidators = {
        checkLists(doc) {
            return {
                '8.1': {
                    description: 'Lists properly structured',
                    validate: () => {
                        const lists = doc.querySelectorAll('ul, ol');
                        return Array.from(lists).every(list => 
                            Array.from(list.children).every(child => child.tagName === 'LI'));
                    }
                },
                '8.2': {
                    description: 'Nested lists proper',
                    validate: () => {
                        const nestedLists = doc.querySelectorAll('li > ul, li > ol');
                        return nestedLists.length === 0 || 
                            Array.from(nestedLists).every(list => 
                                list.parentElement.tagName === 'LI');
                    }
                },
                '8.3': {
                    description: 'Definition lists proper',
                    validate: () => {
                        const dlLists = doc.querySelectorAll('dl');
                        return Array.from(dlLists).every(dl => 
                            Array.from(dl.children).every(child => 
                                child.tagName === 'DT' || child.tagName === 'DD'));
                    }
                }
            };
        }
    };

    // Sezione 9: Note e Annotazioni (90-102)
    static noteValidators = {
        checkNotes(doc) {
            return {
                '9.1': {
                    description: 'Footnotes properly linked',
                    validate: () => {
                        const footnoteRefs = doc.querySelectorAll('a[role="doc-noteref"]');
                        return Array.from(footnoteRefs).every(ref => {
                            const targetId = ref.getAttribute('href')?.substring(1);
                            return targetId && doc.getElementById(targetId) !== null;
                        });
                    }
                },
                '9.2': {
                    description: 'Footnotes properly structured',
                    validate: () => {
                        const footnotes = doc.querySelectorAll('[role="doc-footnote"]');
                        return footnotes.length === 0 || 
                            Array.from(footnotes).every(note => 
                                note.getAttribute('id') !== null);
                    }
                }
            };
        }
    };

    // Sezione 10: Riferimenti e Citazioni (103-115)
    static referenceValidators = {
        checkReferences(doc) {
            return {
                '10.1': {
                    description: 'Citations properly marked',
                    validate: () => {
                        const citations = doc.querySelectorAll('cite');
                        return citations.length === 0 || 
                            Array.from(citations).every(cite => 
                                cite.textContent.trim().length > 0);
                    }
                },
                '10.2': {
                    description: 'Quotes properly marked',
                    validate: () => {
                        const quotes = doc.querySelectorAll('blockquote, q');
                        return Array.from(quotes).every(quote => 
                            quote.textContent.trim().length > 0);
                    }
                }
            };
        }
    };

    // Sezione 11: Contenuti Multimediali (116-128)
    static mediaValidators = {
        checkMedia(doc) {
            return {
                '11.1': {
                    description: 'Audio descriptions available',
                    validate: () => {
                        const videos = doc.querySelectorAll('video');
                        return Array.from(videos).every(video => 
                            video.hasAttribute('aria-describedby'));
                    }
                },
                '11.2': {
                    description: 'Captions available',
                    validate: () => {
                        const videos = doc.querySelectorAll('video');
                        return Array.from(videos).every(video => 
                            video.querySelector('track[kind="captions"]') !== null);
                    }
                }
            };
        }
    };

    // Sezione 12: Contenuti Matematici e Scientifici (129-136)
    static mathValidators = {
        checkMath(doc) {
            return {
                '12.1': {
                    description: 'MathML properly structured',
                    validate: () => {
                        const mathElements = doc.querySelectorAll('math');
                        return Array.from(mathElements).every(math => 
                            math.getAttribute('display') !== null);
                    }
                },
                '12.2': {
                    description: 'Math alternatives available',
                    validate: () => {
                        const mathElements = doc.querySelectorAll('math');
                        return Array.from(mathElements).every(math => 
                            math.hasAttribute('alttext'));
                    }
                }
            };
        }
    };

    static async validateDocument(html) {
        const validations = [];
        const dom = new JSDOM(html);
        const doc = dom.window.document;

        // Combina tutti i validatori
        const allValidators = {
            ...this.documentTreeValidators.checkDocumentStructure(doc),
            ...this.tableValidators.checkTableStructure(doc),
            ...this.nonTextValidators.checkImages(doc),
            ...this.navigationValidators.checkLinks(doc),
            ...this.formValidators.checkForms(doc),
            ...this.metadataValidators.checkMetadata(doc),
            ...this.listValidators.checkLists(doc),
            ...this.noteValidators.checkNotes(doc),
            ...this.referenceValidators.checkReferences(doc),
            ...this.mediaValidators.checkMedia(doc),
            ...this.mathValidators.checkMath(doc)
        };

        // Esegui tutte le validazioni
        const results = {
            passed: [],
            failed: [],
            total: Object.keys(allValidators).length
        };

        for (const [id, validator] of Object.entries(allValidators)) {
            try {
                const isValid = await validator.validate();
                if (isValid) {
                    results.passed.push({
                        id,
                        description: validator.description
                    });
                } else {
                    results.failed.push({
                        id,
                        description: validator.description
                    });
                }
            } catch (error) {
                results.failed.push({
                    id,
                    description: validator.description,
                    error: error.message
                });
            }
        }

        return {
            isValid: results.failed.length === 0,
            results: {
                passed: results.passed,
                failed: results.failed,
                total: results.total,
                passedCount: results.passed.length,
                failedCount: results.failed.length
            }
        };
    }
}

module.exports = MatterhornValidator;
