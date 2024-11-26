const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const MatterhornValidator = require('./matterhorn-validator');
const { PDFUAConverter } = require('./pdf-converter');
const { HTMLFixer } = require('./html-fixer');

const app = express();

// Security middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
    },
  }
}));
app.use(cors());

// Basic middlewares
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/validate', async (req, res) => {
  try {
    const { html } = req.body;
    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    const validator = new MatterhornValidator();
    const results = await validator.validateDocument(html);
    res.json(results);
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

app.post('/convert', async (req, res) => {
  try {
    const { html } = req.body;
    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    const converter = new PDFUAConverter();
    const pdfBuffer = await converter.convertToPDFUA(html);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=document.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ 
      error: 'Conversion failed', 
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.post('/fix-html', async (req, res) => {
  try {
      const { html } = req.body;
      if (!html) {
          return res.status(400).json({ error: 'HTML content is required' });
      }

      const fixer = new HTMLFixer();
      const fixedHtml = await fixer.fixHTML(html);

      // Valida l'HTML corretto
      const validator = new MatterhornValidator();
      const validationResults = await validator.validateDocument(fixedHtml);

      res.json({
          fixedHtml,
          validation: validationResults
      });
  } catch (error) {
      console.error('Fix HTML error:', error);
      res.status(500).json({ 
          error: 'HTML fix failed', 
          details: error.message 
      });
  }
});