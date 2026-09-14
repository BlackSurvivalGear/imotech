# ImoTech Consultation — Apps Script setup

1. Create a standalone Google Apps Script project.
2. Copy `Code.gs` into the project.
3. Enable **Show appsscript.json manifest file** in Project Settings and replace the manifest with `appsscript.json`.
4. In **Project Settings → Script Properties**, add:
   - `OPENAI_API_KEY` = your API key
   - `OPENAI_MODEL` = model to use (optional; defaults to `gpt-5-mini`)
5. In the editor, select and run `authoriseImoTechConsultation` once. Approve the requested send-mail and external-request permissions.
6. Deploy → New deployment → Web app.
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Copy the `/exec` Web App URL.
8. In `consultation.html`, replace `PASTE_APPS_SCRIPT_WEB_APP_URL_HERE` with that URL.
9. Redeploy the web app after later backend changes.

## Submission behaviour

A successful submission:
- sends the full internal project brief to `admin@lawal.org`;
- uses the customer's email as Reply-To on the admin message;
- sends the customer a shorter confirmation and initial recommendation;
- returns the initial recommendation to the consultation UI.

The API key stays in Apps Script Script Properties and must never be placed in `consultation.html` or committed to GitHub.