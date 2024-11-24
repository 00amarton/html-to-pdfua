const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

class PDFUAValidator {
    constructor() {
        this.veraPDFPath = process.env.VERAPDF_PATH || 'verapdf';
        this.validationProfiles = {
            UA1: 'pdf_ua_1',
            UA2: 'pdf_ua_2',
            WCAG: 'wcag2a'
        };
    }

    async validatePDF(pdfBuffer, profile = 'UA1') {
        const tempFilePath = `/tmp/pdf-${Date.now()}.pdf`;
        const reportPath = `/tmp/report-${Date.now()}.xml`;

        try {
            // Scrivi il PDF su file temporaneo
            await fs.writeFile(tempFilePath, pdfBuffer);

            // Esegui veraPDF
            const validationProfile = this.validationProfiles[profile];
            const command = `${this.veraPDFPath} --format xml --profile ${validationProfile} --extract --output "${reportPath}" "${tempFilePath}"`;
            
            await execPromise(command);

            // Leggi il report XML
            const reportXML = await fs.readFile(reportPath, 'utf8');
            
            // Analizza i risultati
            const results = await this.parseValidationResults(reportXML);

            return {
                isValid: results.isCompliant,
                profile: profile,
                timestamp: new Date().toISOString(),
                details: {
                    errors: results.errors,
                    warnings: results.warnings,
                    info: results.info
                },
                summary: {
                    totalChecks: results.totalChecks,
                    passedChecks: results.passedChecks,
                    failedChecks: results.failedChecks,
                    warningChecks: results.warningChecks
                },
                documentProperties: results.documentProperties
            };

        } catch (error) {
            throw new Error(`Errore nella validazione PDF/UA: ${error.message}`);
        } finally {
            // Pulisci i file temporanei
            await Promise.all([
                fs.unlink(tempFilePath).catch(() => {}),
                fs.unlink(reportPath).catch(() => {})
            ]);
        }
    }

    async parseValidationResults(xmlReport) {
        const xml2js = require('xml2js');
        const parser = new xml2js.Parser({ explicitArray: false });
        
        try {
            const result = await parser.parseStringPromise(xmlReport);
            const report = result.report;
            const jobs = report.jobs.job;
            const validationResult = jobs.validationReport;

            const details = {
                isCompliant: validationResult.isCompliant === 'true',
                totalChecks: parseInt(validationResult.totalAssertions),
                passedChecks: 0,
                failedChecks: 0,
                warningChecks: 0,
                errors: [],
                warnings: [],
                info: [],
                documentProperties: {}
            };

            // Analizza le validazioni
            if (validationResult.assertions) {
                const assertions = Array.isArray(validationResult.assertions.assertion) 
                    ? validationResult.assertions.assertion 
                    : [validationResult.assertions.assertion];

                assertions.forEach(assertion => {
                    const item = {
                        clause: assertion.clause,
                        testNumber: assertion.testNumber,
                        description: assertion.description,
                        location: assertion.location,
                        errorMessage: assertion.errorMessage
                    };

                    switch (assertion.status) {
                        case 'failed':
                            details.errors.push(item);
                            details.failedChecks++;
                            break;
                        case 'passed':
                            details.passedChecks++;
                            break;
                        case 'warning':
                            details.warnings.push(item);
                            details.warningChecks++;
                            break;
                    }
                });
            }

            // Estrai proprietà del documento
            if (jobs.featuresReport && jobs.featuresReport.documentResources) {
                const resources = jobs.featuresReport.documentResources;
                details.documentProperties = {
                    title: resources.title,
                    author: resources.author,
                    subject: resources.subject,
                    keywords: resources.keywords,
                    producer: resources.producer,
                    creationDate: resources.creationDate,
                    modificationDate: resources.modificationDate
                };
            }

            return details;

        } catch (error) {
            throw new Error(`Errore nell'analisi del report: ${error.message}`);
        }
    }

    async generateAccessibilityReport(validationResults) {
        const report = {
            title: 'Report Accessibilità PDF/UA',
            timestamp: new Date().toISOString(),
            summary: validationResults.summary,
            compliance: {
                status: validationResults.isValid ? 'Conforme' : 'Non conforme',
                profile: validationResults.profile,
                score: (validationResults.summary.passedChecks / validationResults.summary.totalChecks * 100).toFixed(2) + '%'
            },
            issues: []
        };

        // Organizza i problemi per categoria
        const categorizedIssues = this.categorizeIssues(validationResults.details);
        report.issues = this.formatIssuesForReport(categorizedIssues);

        return report;
    }

    categorizeIssues(details) {
        const categories = {
            'Struttura del documento': [],
            'Tag e ruoli semantici': [],
            'Alternative testuali': [],
            'Navigazione': [],
            'Tabelle': [],
            'Metadata': [],
            'Altri problemi': []
        };

        // Funzione per determinare la categoria di un problema
        const determineCategory = (issue) => {
            const description = issue.description.toLowerCase();
            
            if (description.includes('structure') || description.includes('heading')) {
                return 'Struttura del documento';
            } else if (description.includes('tag') || description.includes('role')) {
                return 'Tag e ruoli semantici';
            } else if (description.includes('alt') || description.includes('text alternative')) {
                return 'Alternative testuali';
            } else if (description.includes('navigation') || description.includes('bookmark')) {
                return 'Navigazione';
            } else if (description.includes('table')) {
                return 'Tabelle';
            } else if (description.includes('metadata') || description.includes('title')) {
                return 'Metadata';
            } else {
                return 'Altri problemi';
            }
        };

        // Categorizza errori e warning
        [...details.errors, ...details.warnings].forEach(issue => {
            const category = determineCategory(issue);
            categories[category].push({
                ...issue,
                severity: details.errors.includes(issue) ? 'error' : 'warning'
            });
        });

        return categories;
    }

    formatIssuesForReport(categorizedIssues) {
        const formattedIssues = [];

        for (const [category, issues] of Object.entries(categorizedIssues)) {
            if (issues.length > 0) {
                formattedIssues.push({
                    category,
                    count: issues.length,
                    items: issues.map(issue => ({
                        severity: issue.severity,
                        description: issue.description,
                        location: issue.location,
                        suggestion: this.getSuggestionForIssue(issue)
                    }))
                });
            }
        }

        return formattedIssues;
    }

    getSuggestionForIssue(issue) {
        // Database di suggerimenti comuni
        const suggestions = {
            'missing alt text': 'Aggiungi un testo alternativo descrittivo per l\'elemento',
            'invalid table structure': 'Assicurati che la tabella abbia intestazioni appropriate e una struttura logica',
            'heading structure': 'Verifica che la gerarchia dei titoli sia corretta e sequenziale',
            'missing document title': 'Aggiungi un titolo significativo al documento',
            'invalid tag': 'Correggi o aggiungi i tag appropriati per questo elemento'
        };

        // Cerca una corrispondenza nel database dei suggerimenti
        for (const [key, suggestion] of Object.entries(suggestions)) {
            if (issue.description.toLowerCase().includes(key)) {
                return suggestion;
            }
        }

        return 'Verifica la conformità con le linee guida PDF/UA';
    }
}

module.exports = { PDFUAValidator };
