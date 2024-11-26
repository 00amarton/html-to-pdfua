document.addEventListener('DOMContentLoaded', () => {
    const htmlInput = document.getElementById('html-input');
    const validateBtn = document.getElementById('validate-btn');
    const convertBtn = document.getElementById('convert-btn');
    const clearBtn = document.getElementById('clear-btn');
    const validationResults = document.getElementById('validation-results');

    // Disabilita inizialmente il pulsante di conversione
    convertBtn.disabled = true;

    // Funzione per validare l'HTML
    async function validateHTML(html) {
        try {
            const response = await fetch('/api/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ html })
            });

            if (!response.ok) {
                throw new Error('Errore nella validazione');
            }

            return await response.json();
        } catch (error) {
            console.error('Errore:', error);
            throw error;
        }
    }

    // Funzione per convertire in PDF/UA
    async function convertToPDF(html) {
        try {
            const response = await fetch('/api/convert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ html })
            });

            if (!response.ok) {
                throw new Error('Errore nella conversione');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'document.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Errore:', error);
            showResult('Errore durante la conversione', 'error');
        }
    }

    // Funzione per mostrare i risultati
    function showResult(message, type = 'success') {
        const resultDiv = document.createElement('div');
        resultDiv.className = `result-item ${type}`;
        resultDiv.textContent = message;
        validationResults.innerHTML = '';
        validationResults.appendChild(resultDiv);
    }

    // Event Listeners
    validateBtn.addEventListener('click', async () => {
        const html = htmlInput.value.trim();
        if (!html) {
            showResult('Inserisci il codice HTML da validare', 'error');
            return;
        }

        try {
            validateBtn.disabled = true;
            const results = await validateHTML(html);
            
            if (results.isValid) {
                showResult('HTML valido! Puoi procedere con la conversione');
                convertBtn.disabled = false;
            } else {
                showResult(`Trovati ${results.errors.length} errori di validazione`, 'error');
                convertBtn.disabled = true;
            }
        } catch (error) {
            showResult('Errore durante la validazione', 'error');
        } finally {
            validateBtn.disabled = false;
        }
    });

    convertBtn.addEventListener('click', async () => {
        const html = htmlInput.value.trim();
        if (!html) return;

        try {
            convertBtn.disabled = true;
            await convertToPDF(html);
            showResult('PDF generato con successo!');
        } finally {
            convertBtn.disabled = false;
        }
    });

    clearBtn.addEventListener('click', () => {
        htmlInput.value = '';
        validationResults.innerHTML = '';
        convertBtn.disabled = true;
    });
});