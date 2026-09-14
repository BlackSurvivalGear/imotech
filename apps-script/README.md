# ImoTech AI Consultation Backend

The GitHub Pages frontend collects grouped service selections, a free-text customer description, relevant service-specific answers, general project information and contact details.

The Apps Script Web App is the server-side boundary. It calls the AI provider using a key stored in Script Properties, produces an advisory project analysis, emails the full internal brief to `admin@lawal.org`, emails a shorter confirmation to the customer, and returns the initial recommendation to the browser.

The AI prompt explicitly prevents invented pricing and delivery promises. Human ImoTech review remains required before scope, price or delivery is confirmed.

See `SETUP.md` for deployment instructions.