/**
 * GigShield Frontend API
 * Sends worker + location data to the Express backend which computes
 * live risk using real weather data — no external automation needed.
 *
 * Endpoint: POST http://127.0.0.1:3001/api/automation/risk-check
 */

import { checkRiskWithFallback } from '../utils/riskEngine';
import { getApiUrl } from '../utils/api';
export async function checkGigShieldRisk(workerPayload) {
  try {
    const response = await fetch(getApiUrl('/api/automation/risk-check'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workerPayload),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.warn(
        `[API] Backend returned ${response.status}. Falling back to local engine.`,
      );
      return await checkRiskWithFallback(workerPayload);
    }

    const json = await response.json();
    if (!json.success) {
      console.warn(`[API] Backend unsuccessful. Falling back to local engine.`);
      return await checkRiskWithFallback(workerPayload);
    }

    return json.data;
  } catch (err) {
    console.warn(
      `[API] Fetch failed (${err.message}). Falling back to local engine.`,
    );
    return await checkRiskWithFallback(workerPayload);
  }
}
