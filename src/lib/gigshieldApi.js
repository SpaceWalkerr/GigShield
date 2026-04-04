/**
 * GigShield Frontend API
 * Sends worker + location data to the Express backend which computes
 * live risk using real weather data — no external automation needed.
 *
 * Endpoint: POST http://127.0.0.1:3001/api/automation/risk-check
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:3001';

/**
 * @param {Object} workerPayload
 * @returns {Promise<RiskResult>} Normalized risk result object
 */
export async function checkGigShieldRisk(workerPayload) {
  const response = await fetch(`${BACKEND_URL}/api/automation/risk-check`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(workerPayload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Server error ${response.status}${text ? ': ' + text : ''}`);
  }

  const json = await response.json();

  if (!json.success) {
    throw new Error(json.error || 'The risk engine returned an unsuccessful response.');
  }

  return json.data;
}
