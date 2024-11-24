
document.addEventListener('DOMContentLoaded', () => {
    const htmlInput = document.getElementById('html-input');
    const validateBtn = document.getElementById('validate-btn');
    const convertBtn = document.getElementById('convert-btn');
    const clearBtn = document.getElementById('clear-btn');
    const loadingOverlay = document.getElementById('loading');
    const validationStatus = document.getElementById('validation-status');

    let currentValidationResults = null;

    // Validazione
    validateBtn.addEventListener('click', async () => {
        const html = htmlInput.value.trim();
        
        if (!html) {
            showStatus('error', 'Inserisci il codice HTML da validare');
            return;
        }

        try {
            showLoading(true);
            const results = await validateHTML(html);
            currentValidationResults = results;
            displayResults(results);
            
            // Abilita/disabilita il pulsante di conversione in base ai risultati
            convertBtn.disabled = !isHtmlValid(results);
        } catch (error) {
            showStatus('error', 'Errore durante la validazione: ' + error.message);
            convertBtn.disabled = true;
        } finally {
            showLoading(false);
        }
    });

    // Conversione in PDF/UA
    convertBtn.addEventListener('click', async () => {
        if (!currentValidationResults) {
            showStatus('error', 'Esegui prima la validazione');
            return;
        }

        try {
            showLoading(true);
            const response = await fetch('/convert-to-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    html: htmlInput.value.trim(),
                    validation: currentValidationResults
                })
            });

            if (!response.ok) throw new Error('Errore nella conversione');

            const blob = await response.blob();
            downloadPdf(blob);
            showStatus('success', 'PDF/UA generato con successo');
        } catch (error) {
            showStatus('error', 'Errore durante la conversione: ' + error.message);
        } finally {
            showLoading(false);
        }
    });

    // Pulisci form
    clearBtn.addEventListener('click', () => {
        htmlInput.value = '';
        clearResults();
        convertBtn.disabled = true;
        currentValidationResults = null;
    });

    async function validateHTML(html) {
        const response = await fetch('/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ html })
        });

        if (!response.ok) {
            throw new Error('Errore nella richiesta di validazione');
        }

        return await response.json();
    }

    function displayResults(results) {
        clearResults();
        
        const hasErrors = results.errors && results.errors.length > 0;
        const hasWarnings = results.warnings && results.warnings.length > 0;
        
        if (!hasErrors && !hasWarnings) {
            showStatus('success', 'HTML valido e pronto per la conversione in PDF/UA');
        } else {
            showStatus('warning', 'Sono stati rilevati alcuni problemi da correggere');
        }

        const issuesContent = document.getElementById('issues-content');
        
        if (hasErrors) {
            results.errors.forEach(error => {
                issuesContent.appendChild(createIssueElement(error, 'error'));
            });
        }

        if (hasWarnings) {
            results.warnings.forEach(warning => {
                issuesContent.appendChild(createIssueElement(warning, 'warning'));
            });
        }

        updateSummary(results);
    }

    function createIssueElement(issue, type) {
        const div = document.createElement('div');
        div.className = `issue-item ${type}`;
        
        div.innerHTML = `
            <h4>${issue.title || type.toUpperCase()}</h4>
            <p>${issue.message}</p>
            ${issue.suggestion ? `<p class="suggestion">Suggerimento: ${issue.suggestion}</p>` : ''}
            ${issue.code ? `<pre class="code-preview">${issue.code}</pre>` : ''}
        `;

        return div;
    }

    function updateSummary(results) {
        const summaryContent = document.getElementById('summary-content');
        summaryContent.innerHTML = `
            <div class="summary-grid">
                <div class="summary-item ${results.errors.length > 0 ? 'error' : ''}">
                    <span class="count">${results.errors.length}</span>
                    <span class="label">Errori</span>
                </div>
                <div class="summary-item ${results.warnings.length > 0 ? 'warning' : ''}">
                    <span class="count">${results.warnings.length}</span>
                    <span class="label">Avvisi</span>
                </div>
            </div>
        `;
    }

    function showStatus(type, message) {
        validationStatus.className = `validation-status ${type}`;
        validationStatus.textContent = message;
    }

    function clearResults() {
        const issuesContent = document.getElementById('issues-content');
        const summaryContent = document.getElementById('summary-content');
        validationStatus.className = 'validation-status';
        validationStatus.textContent = '';
        issuesContent.innerHTML = '';
        summaryContent.innerHTML = '';
    }

    function showLoading(show) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    function isHtmlValid(results) {
        return results.errors.length === 0;
    }

    function downloadPdf(blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'document.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    }
});
