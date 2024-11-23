async function validateHTML() {
    const html = document.getElementById('htmlInput').value;
    if (!html.trim()) {
        alert('Inserisci del codice HTML da validare');
        return;
    }

    showLoading(true);
    try {
        const response = await fetch('/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html })
        });

        const result = await response.json();
        displayValidationResults(result);
        document.getElementById('convertBtn').disabled = !result.isValid;
    } catch (error) {
        console.error('Errore:', error);
        alert('Errore durante la validazione');
    } finally {
        showLoading(false);
    }
}

function displayValidationResults(result) {
    const container = document.getElementById('validationResults');
    const summary = document.getElementById('summary');
    container.innerHTML = '';
    summary.style.display = 'flex';

    // Aggiorna sommario
    document.getElementById('totalChecks').textContent = result.results.total;
    document.getElementById('passedChecks').textContent = result.results.passedCount;
    document.getElementById('failedChecks').textContent = result.results.failedCount;

    // Raggruppa per categoria
    const categories = {};
    [...result.results.passed, ...result.results.failed].forEach(check => {
        const category = check.id.split('.')[0];
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push(check);
    });

    // Crea elementi UI per ogni categoria
    Object.entries(categories).forEach(([category, checks]) => {
        const categoryEl = document.createElement('div');
        categoryEl.className = 'category';
        
        const passed = checks.filter(c => result.results.passed.includes(c)).length;
        const total = checks.length;

        categoryEl.innerHTML = `
            <div class="category-header">
                <span>Categoria ${category}</span>
                <span>${passed}/${total} passati</span>
            </div>
            ${checks.map(check => `
                <div class="checkpoint">
                    <div class="status-icon ${result.results.passed.includes(check) ? 'status-pass' : 'status-fail'}">
                        ${result.results.passed.includes(check) ? '✓' : '✗'}
                    </div>
                    <div>
                        <strong>${check.id}</strong>: ${check.description}
                    </div>
                </div>
            `).join('')}
        `;

        container.appendChild(categoryEl);
    });
}

async function convertToPDF() {
    const html = document.getElementById('htmlInput').value;
    showLoading(true);

    try {
        const response = await fetch('/convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'documento-accessibile.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Errore:', error);
        alert('Errore durante la conversione: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}
