services:
  - type: web
    name: pdf-generator
    env: docker
    dockerImage: wkhtmltopdf/alpine
    envVars:
      - key: URL
        sync: false
        generators:
          - constant: https://tuo-url-github-pages.com
    routes:
      - type: http
        path: /pdf
    plan: free
