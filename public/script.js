async function convertToPDF() {
    const htmlInput = document.getElementById('htmlInput').value;
    const status = document.getElementById('status');

    try {
        status.textContent = 'Conversione in corso...';
        status.className = 'status';

        const response = await fetch('/convert', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ html: htmlInput })
        });

        if (!response.ok) throw new Error('Errore nella conversione');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'documento-accessibile.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        status.textContent = 'PDF/UA generato con successo!';
        status.className = 'status success';
    } catch (error) {
        status.textContent = 'Errore: ' + error.message;
        status.className = 'status error';
    }
}

async function validateHTML() {
    const htmlInput = document.getElementById('htmlInput').value;
    const status = document.getElementById('status');

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlInput, 'text/html');
        const errors = doc.getElementsByTagName('parsererror');

        if (errors.length > 0) {
            throw new Error('HTML non valido');
        }

        status.textContent = 'HTML validato con successo!';
        status.className = 'status success';
    } catch (error) {
        status.textContent = 'HTML non valido: ' + error.message;
        status.className = 'status error';
    }
}
