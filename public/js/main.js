document.addEventListener('DOMContentLoaded', () => {
    const htmlInput = document.getElementById('html-input');
    const validateBtn = document.getElementById('validate-btn');
    const convertBtn = document.getElementById('convert-btn');
    const clearBtn = document.getElementById('clear-btn');
    const fixBtn = document.getElementById('fix-btn');
    const validationResults = document.getElementById('validation-results');
    const loadingOverlay = document.getElementById('loading');

    let currentValidation = null;

    validateBtn.addEventListener('click', async () => {
        const html = htmlInput.value.trim();
        
        if (!html) {
            showResult({
                type: 'error',
                message: 'Please enter HTML content to validate'
            });
            return;
        }

        showLoading(true);
        
        try {
            const response = await fetch('/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ html })
            });

            if (!response.ok) {
                throw new Error('Validation request failed');
            }

            const result = await response.json();
            currentValidation = result;
            
            displayValidationResults(result);
            convertBtn.disabled = !result.isValid;
            fixBtn.disabled = result.isValid; // Disabilita Fix se HTML è valido
            
        } catch (error) {
            console.error('Validation error:', error);
            showResult({
                type: 'error',
                message: 'Error during validation: ' + error.message
            });
            convertBtn.disabled = true;
            fixBtn.disabled = false;
        } finally {
            showLoading(false);
        }
    });

    fixBtn.addEventListener('click', async () => {
        const html = htmlInput.value.trim();
        
        if (!html) {
            showResult({
                type: 'error',
                message: 'Please enter HTML content to fix'
            });
            return;
        }

        showLoading(true);
        
        try {
            const response = await fetch('/fix-html', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ html })
            });

            if (!response.ok) {
                throw new Error('Fix request failed');
            }

            const result = await response.json();
            htmlInput.value = result.fixedHtml;
            
            displayValidationResults(result.validation);
            
            showResult({
                type: 'success',
                message: 'HTML fixed and validated successfully!',
                details: `The HTML has been automatically corrected and validated.`
            });

            // Aggiorna stati bottoni
            convertBtn.disabled = !result.validation.isValid;
            fixBtn.disabled = result.validation.isValid;
            
        } catch (error) {
            console.error('Fix error:', error);
            showResult({
                type: 'error',
                message: 'Error during HTML fix: ' + error.message
            });
        } finally {
            showLoading(false);
        }
    });

    convertBtn.addEventListener('click', async () => {
        if (!currentValidation?.isValid) {
            showResult({
                type: 'warning',
                message: 'Please validate HTML first'
            });
            return;
        }

        showLoading(true);
        
        try {
            const response = await fetch('/convert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    html: htmlInput.value.trim() 
                })
            });

            if (!response.ok) {
                throw new Error('Conversion request failed');
            }

            const blob = await response.blob();
            downloadPDF(blob);
            
            showResult({
                type: 'success',
                message: 'PDF/UA generated successfully!',
                details: 'The PDF has been generated with full accessibility support.'
            });
            
        } catch (error) {
            console.error('Conversion error:', error);
            showResult({
                type: 'error',
                message: 'Error during conversion: ' + error.message
            });
        } finally {
            showLoading(false);
        }
    });

    clearBtn.addEventListener('click', () => {
        htmlInput.value = '';
        validationResults.innerHTML = '';
        currentValidation = null;
        convertBtn.disabled = true;
        fixBtn.disabled = false; // Riabilita Fix dopo clear
    });

    function displayValidationResults(result) {
        if (result.isValid) {
            showResult({
                type: 'success',
                message: 'HTML is valid and ready for conversion!',
                details: `
                    <div class="validation-summary">
                        <p>Passed ${result.results.passedCount} out of ${result.results.total} checks.</p>
                        <p>Your HTML is fully compliant with accessibility standards.</p>
                    </div>
                `
            });
        } else {
            const issuesHtml = result.results.failed.map(issue => `
                <div class="issue-item">
                    <strong>${issue.id}:</strong> ${issue.description}
                </div>
            `).join('');

            showResult({
                type: 'warning',
                message: 'Please fix the following issues:',
                details: `
                    <div class="validation-summary">
                        <p>Failed ${result.results.failedCount} out of ${result.results.total} checks.</p>
                        <p>Click "Fix HTML" to automatically correct these issues.</p>
                    </div>
                    <div class="issues-list">
                        ${issuesHtml}
                    </div>
                `
            });
        }
    }

    function showResult({ type, message, details = '' }) {
        validationResults.innerHTML = `
            <div class="validation-result validation-${type}">
                <h3>${message}</h3>
                ${details}
            </div>
        `;
    }

    function showLoading(show) {
        loadingOverlay.classList.toggle('hidden', !show);
    }

    function downloadPDF(blob) {
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