document.addEventListener('DOMContentLoaded', () => {
    const htmlInput = document.getElementById('html-input');
    const validateBtn = document.getElementById('validate-btn');
    const clearBtn = document.getElementById('clear-btn');
    const loadingOverlay = document.getElementById('loading');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    // Gestione tabs
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            
            // Aggiorna stati attivi
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Pulisci input
    clearBtn.addEventListener('click', () => {
        htmlInput.value = '';
        clearResults();
    });

    // Validazione
    validateBtn.addEventListener('click', async () => {
        const html = htmlInput.value.trim();
        
        if (!html) {
            showError('Inserisci il codice HTML da validare');
            return;
        }

        try {
            showLoading(true);
            const results = await validateHTML(html);
            displayResults(results);
        } catch (error) {
            showError('Errore durante la validazione: ' + error.message);
        } finally {
            showLoading(false);
        }
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
        
        // Aggiorna il riepilogo
        const summaryContent = document.getElementById('summary-content');
        summaryContent.innerHTML = createSummaryHTML(results);

        // Popola i pannelli
        populateStructurePanel(results.validazione.struttura);
        populateAccessibilityPanel(results.validazione.accessibilita);
        populateSuggestionsPanel(results.suggerimenti);
    }

    function createSummaryHTML(results) {
        const struttura = results.validazione.struttura;
        const accessibilita = results.validazione.accessibilita;

        return `
            <div class="summary-grid">
                <div class="summary-item">
                    <h4>Errori Strutturali</h4>
                    <span class="count error">${struttura.errori.length}</span>
                </div>
                <div class="summary-item">
                    <h4>Problemi di Accessibilità</h4>
                    <span class="count warning">${accessibilita.errori.length}</span>
                </div>
                <div class="summary-item">
                    <h4>Suggerimenti</h4>
                    <span class="count info">${results.suggerimenti.length}</span>
                </div>
            </div>
        `;
    }

    function populateStructurePanel(struttura) {
        const panel = document.getElementById('struttura');
        
        struttura.errori.forEach(errore => {
            panel.appendChild(createValidationItem(errore, 'error'));
        });

        struttura.avvisi.forEach(avviso => {
            panel.appendChild(createValidationItem(avviso, 'warning'));
        });

        if (struttura.errori.length === 0 && struttura.avvisi.length === 0) {
            panel.innerHTML = '<p class="success-message">Nessun problema strutturale rilevato</p>';
        }
    }

    function populateAccessibilityPanel(accessibilita) {
        const panel = document.getElementById('accessibilita');
        
        accessibilita.errori.forEach(errore => {
            panel.appendChild(createValidationItem(errore, 'error'));
        });

        accessibilita.avvisi.forEach(avviso => {
            panel.appendChild(createValidationItem(avviso, 'warning'));
        });

        if (accessibilita.errori.length === 0 && accessibilita.avvisi.length === 0) {
            panel.innerHTML = '<p class="success-message">Nessun problema di accessibilità rilevato</p>';
        }
    }

    function populateSuggestionsPanel(suggerimenti) {
        const panel = document.getElementById('suggerimenti');
        
        suggerimenti.forEach(suggerimento => {
            panel.appendChild(createValidationItem(suggerimento, 'info'));
        });

        if (suggerimenti.length === 0) {
            panel.innerHTML = '<p class="info-message">Nessun suggerimento disponibile</p>';
        }
    }

    function createValidationItem(item, type) {
        const div = document.createElement('div');
        div.className = `validation-item ${type}`;
        
        div.innerHTML = `
            <h4>${item.categoria || item.tipo}</h4>
            <p>${item.messaggio || item.descrizione}</p>
            ${item.suggerimento ? `<p class="suggestion"><strong>Suggerimento:</strong> ${item.suggerimento}</p>` : ''}
            ${item.elementi ? `<pre class="code-preview">${item.elementi.join('\n')}</pre>` : ''}
        `;

        return div;
    }

    function clearResults() {
        document.getElementById('summary-content').innerHTML = '';
        document.getElementById('struttura').innerHTML = '';
        document.getElementById('accessibilita').innerHTML = '';
        document.getElementById('suggerimenti').innerHTML = '';
    }

    function showLoading(show) {
        loadingOverlay.style.display = show ? 'flex' :
