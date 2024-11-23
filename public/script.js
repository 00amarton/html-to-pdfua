async function validateHTML() {
    const html = document.getElementById("htmlInput").value;
    if (!html) return;

    try {
        // Invia l'HTML al server per la validazione
        const response = await fetch('/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html })
        });

        const result = await response.json();
        if (response.ok && result.isValid) {
            document.getElementById("suggestions").innerHTML = "L'HTML è valido!";
            document.getElementById("downloadBtn").disabled = false;
        } else {
            document.getElementById("suggestions").innerHTML = '';
            result.suggestions.forEach(suggestion => {
                const div = document.createElement("div");
                div.classList.add('suggestion');
                div.textContent = suggestion.message;
                document.getElementById("suggestions").appendChild(div);
            });
            document.getElementById("downloadBtn").disabled = true;
        }
    } catch (error) {
        console.error('Errore di validazione:', error);
        alert("Errore durante la validazione.");
    }
}

async function generatePDF() {
    const html = document.getElementById("htmlInput").value;
    if (!html) return;

    try {
        // Invia l'HTML per generare il PDF
        const response = await fetch('/convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ html })
        });

        if (response.ok) {
            // Forza il download del PDF
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'documento.pdf';
            link.click();
        } else {
            alert("Errore nella generazione del PDF.");
        }
    } catch (error) {
        console.error('Errore nella generazione PDF:', error);
        alert("Errore durante la generazione del PDF.");
    }
}
