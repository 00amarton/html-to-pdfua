const express = require('express');
const PDFDocument = require('pdfkit');
const { JSDOM } = require('jsdom');
const app = express();

app.use(express.json());
app.use(express.static('public'));

app.post('/convert', async (req, res) => {
  try {
    const { html } = req.body;
    
    // Crea PDF con tag di accessibilità
    const doc = new PDFDocument({
      tagged: true,
      lang: 'it-IT',
      displayTitle: true
    });

    // Imposta metadati PDF/UA
    doc.info['Title'] = 'Documento Accessibile';
    doc.info['Creator'] = 'HTML to PDF/UA Converter';
    doc.info['Producer'] = 'PDFKit';

    // Pipe al response
    res.contentType('application/pdf');
    doc.pipe(res);

    // Processa HTML
    const dom = new JSDOM(html);
    const content = dom.window.document.body.textContent;
    
    doc.text(content);
    doc.end();

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
