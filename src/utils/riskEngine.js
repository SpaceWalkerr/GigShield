/**
 * GigShield Frontend Risk Engine
 * Fallback logic to compute parametric risk when the backend is unavailable.
 */

async function getLocalWeather(lat, lon) {
  try {
    // Open-Meteo (free, no key needed)
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current_weather=true&hourly=relativehumidity_2m,apparent_temperature&forecast_days=1`
    );
    if (!res.ok) throw new Error('Open-Meteo failed');
    const d = await res.json();

    const temp  = d.current_weather.temperature;
    const wind  = d.current_weather.windspeed;
    const code  = d.current_weather.weathercode;
    const hour  = new Date(d.current_weather.time).getHours();
    const humid = d.hourly?.relativehumidity_2m?.[hour] ?? null;
    const feels = d.hourly?.apparent_temperature?.[hour] ?? temp;

    let condition = 'clear';
    if (code >= 51 && code <= 67)  condition = 'rain';
    else if (code >= 71 && code <= 77) condition = 'snow';
    else if (code >= 95)           condition = 'thunderstorm';
    else if (code >= 1 && code <= 3)   condition = 'clouds';

    return {
      temperature:  temp,
      feelsLike:    feels,
      humidity:     humid,
      condition,
      description:  condition,
      windSpeed:    wind,
      locationName: `${lat.toFixed(2)}° N, ${lon.toFixed(2)}° E (Local)`,
      source:       'Open-Meteo (Fallback)',
    };
  } catch (err) {
    console.warn('[RiskEngine] Local weather fetch failed:', err.message);
    return null;
  }
}

function computeRiskLocally({ weather, basePremium = 129 }) {
  let riskLevel         = 'low';
  let riskScore         = 15;
  let triggerType       = 'none';
  let premium           = basePremium;
  let confidence        = 82;
  let explanation       = `Conditions are clear at ${weather?.temperature?.toFixed(1) ?? '–'}°C. Ideal delivery conditions. (Computed Locally)`;
  let recommendedAction = 'No action needed. Continue your deliveries safely.';
  let nextRiskWindow    = 'Next automated check in 6 hours.';
  let claimStatus       = 'no-claim';
  let earningsProtected = 0;
  const claimId         = null;

  if (!weather) {
    return { riskLevel, riskScore, triggerType, premium, confidence, explanation, recommendedAction, nextRiskWindow, claimStatus, claimId, earningsProtected };
  }

  const { temperature, feelsLike, condition, windSpeed } = weather;

  const isHeavyRain  = condition.includes('rain') || condition.includes('thunder') || condition.includes('drizzle');
  const isSnow       = condition.includes('snow');
  const isExtHeat    = temperature > 40 || (feelsLike && feelsLike > 42);
  const isHighWind   = windSpeed > 40;
  const isModHeat    = temperature > 35 && temperature <= 40;

  if (isHeavyRain || isSnow) {
    riskLevel         = 'high';
    riskScore         = 92;
    triggerType       = isSnow ? 'snowfall' : 'heavy_rain';
    premium           = Math.round(basePremium * 1.4);
    confidence        = 94;
    explanation       = `${isSnow ? 'Snowfall' : 'Heavy ' + condition} detected (${temperature.toFixed(1)}°C). Road visibility and traction severely impacted.`;
    recommendedAction = 'Auto-claim is eligible now. Consider pausing deliveries until conditions improve.';
    nextRiskWindow    = 'Hazardous conditions active. Re-check in 1–2 hours.';
    claimStatus       = 'auto-generated';
    earningsProtected = 1000;
  } else if (isExtHeat) {
    riskLevel         = 'high';
    riskScore         = 88;
    triggerType       = 'extreme_heat';
    premium           = Math.round(basePremium * 1.35);
    confidence        = 90;
    explanation       = `Extreme heat at ${temperature.toFixed(1)}°C. Exceeds the 40°C safety threshold.`;
    recommendedAction = 'Hydrate every 15 minutes. Auto-claim activated for heat disruption.';
    nextRiskWindow    = `Peak heat window expected between 12:00–16:00 today.`;
    claimStatus       = 'auto-generated';
    earningsProtected = 1000;
  } else if (isHighWind) {
    riskLevel         = 'medium';
    riskScore         = 60;
    triggerType       = 'high_wind';
    premium           = Math.round(basePremium * 1.25);
    confidence        = 80;
    explanation       = `Wind speed at ${windSpeed.toFixed(1)} km/h. Two-wheeler lateral stability is significantly affected.`;
    recommendedAction = 'Reduce speed on open roads. Payout available if orders are disrupted.';
    nextRiskWindow    = 'Winds expected to ease in the next 3 hours.';
    claimStatus       = 'pending-review';
    earningsProtected = 500;
  } else if (isModHeat) {
    riskLevel         = 'medium';
    riskScore         = 45;
    triggerType       = 'moderate_heat';
    premium           = Math.round(basePremium * 1.15);
    confidence        = 76;
    explanation       = `Temperature at ${temperature.toFixed(1)}°C. Elevated heat — manageable but requires precaution.`;
    recommendedAction = 'Stay hydrated. Take breaks every 45 minutes.';
    nextRiskWindow    = 'Monitor temperature — may escalate to extreme heat by afternoon.';
    claimStatus       = 'no-claim';
    earningsProtected = 0;
  }

  const timeline = `Local risk scan completed at ${new Date().toLocaleTimeString()}`;

  return {
    riskLevel, riskScore, triggerType, premium, confidence,
    explanation, recommendedAction, nextRiskWindow,
    claimStatus, claimId, earningsProtected, timeline,
    notification: riskLevel === 'high' ? 'High Risk detected locally. Auto-protection active.' : 'Conditions scanned locally. All clear.',
    liveWeather: weather,
    _source: 'local-fallback'
  };
}

export async function checkRiskWithFallback(payload) {
  const { latitude, longitude, currentPremium } = payload;
  
  // Try local computation immediately if weather fetch succeeds
  const weather = await getLocalWeather(latitude, longitude);
  if (weather) {
    return computeRiskLocally({ weather, basePremium: currentPremium });
  }

  throw new Error('Local engine failed to fetch weather and backend is unreachable.');
}
