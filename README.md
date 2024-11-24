# HTML to PDF/UA Converter

Convert HTML documents to accessible PDF/UA with Matterhorn Protocol validation.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

## Features

- 🔍 HTML structural validation
- ♿ Accessibility checks following WCAG 2.1
- 📄 PDF/UA compliant conversion
- 📊 Detailed validation reports
- 🚀 Matterhorn Protocol compliance checking
- 🌐 Web-based interface
- 🔄 CI/CD integration

## Prerequisites

- Node.js >= 18.x
- npm or yarn
- VeraPDF (for PDF/UA validation)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/html-to-pdfua.git

# Enter the project directory
cd html-to-pdfua

# Install dependencies
npm install

# Start the development server
npm run dev

# For production
npm start
```

Visit `http://localhost:3000` to use the application.

## Development

```bash
# Run tests
npm test

# Lint code
npm run lint

# Build for production
npm run build
```

## Docker

```bash
# Build the image
docker build -t html-to-pdfua .

# Run the container
docker run -p 3000:3000 html-to-pdfua
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Documentation

For detailed documentation, please visit our [Wiki](../../wiki).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Matterhorn Protocol](https://www.pdfa.org/resource/matterhorn-protocol/)
- [PDF/UA](https://www.pdfa.org/resource/pdfua-in-a-nutshell/)
- [WCAG 2.1](https://www.w3.org/WAI/standards-guidelines/wcag/)
