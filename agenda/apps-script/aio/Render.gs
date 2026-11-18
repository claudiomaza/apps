const AGENDA_BACKEND_URL = 'https://script.google.com/macros/s/AKfycbwtfGNjudJ_TljvRZt5J5Q6rT86p3SaQ3j2gDSAd6VxiduMps2deyShYxoXxxmkFye1/exec';

function doGet() {
  const template = HtmlService.createTemplateFromFile('Agenda');
  template.apiUrl = AGENDA_BACKEND_URL;
  return template.evaluate().setTitle('Agenda');
}

function runAgendaMaintenance(action, payload) {
  if (!['repairSchema', 'refreshReadableViews', 'resetDatabase'].includes(action)) throw new Error('INVALID_ACTION');
  const request = payload || {};
  if (typeof request.sessionToken !== 'string' || !request.sessionToken) throw new Error('UNAUTHORIZED');
  if (action === 'resetDatabase' && (request.confirmation !== 'RESET' || request.backupConfirmed !== true)) throw new Error('RESET_CONFIRMATION_REQUIRED');
  const response = UrlFetchApp.fetch(AGENDA_BACKEND_URL, {
    method: 'post',
    contentType: 'text/plain;charset=utf-8',
    payload: JSON.stringify({...request, action}),
    followRedirects: true,
    muteHttpExceptions: true
  });
  const status = response.getResponseCode();
  if (status < 200 || status >= 300) throw new Error('BACKEND_HTTP_' + status);
  const result = JSON.parse(response.getContentText());
  if (!result || result.ok !== true) throw new Error(result && result.error || 'BACKEND_ERROR');
  return result;
}
