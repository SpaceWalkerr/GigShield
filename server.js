import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

const WEATHER_API_KEY = process.env.WEATHER_API_KEY || '';

app.use(cors());
app.use(express.json());

// ─── Live Weather ──────────────────────────────────────────────────────────────
async function getRealWeather(lat, lon) {
  try {
    if (WEATHER_API_KEY) {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
      );
      if (!res.ok) throw new Error('OWM failed');
      const d = await res.json();
      return {
        temperature:  d.main.temp,
        feelsLike:    d.main.feels_like,
        humidity:     d.main.humidity,
        condition:    d.weather[0].main.toLowerCase(),
        description:  d.weather[0].description,
        windSpeed:    d.wind.speed * 3.6,   // m/s → km/h
        locationName: d.name,
        source:       'OpenWeatherMap',
      };
    }

    // Free fallback — Open-Meteo (no API key needed)
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
      locationName: `${lat.toFixed(2)}° N, ${lon.toFixed(2)}° E`,
      source:       'Open-Meteo',
    };
  } catch (err) {
    console.error('[Backend] Weather fetch failed:', err.message);
    return null;
  }
}

// ─── AQI (optional, best-effort) ──────────────────────────────────────────────
async function getAQI(lat, lon) {
  try {
    if (!WEATHER_API_KEY) return null;
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}`
    );
    if (!res.ok) return null;
    const d = await res.json();
    return d.list?.[0]?.main?.aqi ?? null; // 1=Good … 5=Very Poor
  } catch {
    return null;
  }
}

// ─── Risk Engine ──────────────────────────────────────────────────────────────
function computeRisk({ weather, aqi, basePremium = 129 }) {
  // Defaults — assume safe
  let riskLevel         = 'low';
  let riskScore         = 15;          // 0-100
  let triggerType       = 'none';
  let premium           = basePremium;
  let confidence        = 82;
  let explanation       = `Conditions are clear at ${weather?.temperature?.toFixed(1) ?? '–'}°C. Ideal delivery conditions.`;
  let recommendedAction = 'No action needed. Continue your deliveries safely.';
  let nextRiskWindow    = 'Next automated check in 6 hours.';
  let claimStatus       = 'no-claim';
  let earningsProtected = 0;
  const claimId         = null;

  if (!weather) {
    return { riskLevel, riskScore, triggerType, premium, confidence, explanation, recommendedAction, nextRiskWindow, claimStatus, claimId, earningsProtected };
  }

  const { temperature, feelsLike, condition, windSpeed, humidity } = weather;

  // Evaluate triggers in descending severity
  const isHeavyRain  = condition.includes('rain') || condition.includes('thunder') || condition.includes('drizzle');
  const isSnow       = condition.includes('snow');
  const isExtHeat    = temperature > 40 || (feelsLike && feelsLike > 42);
  const isHighWind   = windSpeed > 40;
  const isModHeat    = temperature > 35 && temperature <= 40;
  const isBadAQI     = aqi != null && aqi >= 4;  // AQI 4=Poor, 5=Very Poor

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
    explanation       = `Extreme heat at ${temperature.toFixed(1)}°C (feels like ${feelsLike?.toFixed(1) ?? '–'}°C). Exceeds the 40°C safety threshold.`;
    recommendedAction = 'Hydrate every 15 minutes. Auto-claim activated for heat disruption.';
    nextRiskWindow    = `Peak heat window expected between 12:00–16:00 today.`;
    claimStatus       = 'auto-generated';
    earningsProtected = 1000;
  } else if (isBadAQI) {
    riskLevel         = 'high';
    riskScore         = 80;
    triggerType       = 'poor_aqi';
    premium           = Math.round(basePremium * 1.3);
    confidence        = 85;
    explanation       = `Air Quality Index is rated ${['','Good','Fair','Moderate','Poor','Very Poor'][aqi] ?? 'Poor'} (AQI ${aqi}/5). Harmful for extended outdoor activity.`;
    recommendedAction = 'Wear N95 mask. Limit continuous riding to under 30 minutes.';
    nextRiskWindow    = 'AQI tends to improve after evening winds. Re-check at 18:00.';
    claimStatus       = 'auto-generated';
    earningsProtected = 750;
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
  } else if (humidity != null && humidity < 20) {
    riskLevel         = 'medium';
    riskScore         = 35;
    triggerType       = 'low_humidity';
    premium           = Math.round(basePremium * 1.08);
    confidence        = 70;
    explanation       = `Very low humidity (${humidity}%). Increased dehydration and fatigue risk for riders.`;
    recommendedAction = 'Increase water intake. Carry an electrolyte drink.';
    nextRiskWindow    = 'Humidity expected to normalize by evening.';
    claimStatus       = 'no-claim';
    earningsProtected = 0;
  }

  const timeline = `Risk scan completed at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;

  return {
    riskLevel, riskScore, triggerType, premium, confidence,
    explanation, recommendedAction, nextRiskWindow,
    claimStatus, claimId, earningsProtected, timeline,
  };
}

// ─── Build full dashboard response ────────────────────────────────────────────
function buildResponse({ worker, weather, aqi, risk }) {
  const now = new Date();

  return {
    // Core risk fields
    riskLevel:         risk.riskLevel,
    riskScore:         risk.riskScore,
    premium:           risk.premium,
    claimStatus:       risk.claimStatus,
    claimId:           risk.claimId,
    coverageStatus:    worker.activeCoverage ? 'active' : 'inactive',
    confidence:        risk.confidence,
    recommendedAction: risk.recommendedAction,
    timeline:          risk.timeline,
    explanation:       risk.explanation,
    nextRiskWindow:    risk.nextRiskWindow,
    earningsProtected: risk.earningsProtected,
    lastTrigger:       risk.triggerType,

    // Notification banner
    notification: risk.riskLevel === 'high'
      ? `⚡ Risk Alert: ${weather?.condition ?? 'Hazard'} detected near ${weather?.locationName ?? 'your area'}. Auto-protection activated.`
      : risk.riskLevel === 'medium'
      ? `⚠️ Moderate Risk: ${weather?.condition ?? 'Conditions'} at ${weather?.temperature?.toFixed(1) ?? '–'}°C. Stay safe.`
      : `✅ All Clear: ${weather?.temperature?.toFixed(1) ?? '–'}°C, ${weather?.condition ?? 'clear sky'}. Safe to deliver.`,

    // Full weather details
    liveWeather: weather ? {
      ...weather,
      aqi,
      aqiLabel: aqi ? ['','Good','Fair','Moderate','Poor','Very Poor'][aqi] : null,
    } : null,

    // Worker context echo
    worker: {
      id:         worker.workerId,
      name:       worker.workerName,
      zone:       worker.zone,
      platform:   worker.platform,
      coverage:   worker.coverageTier,
    },

    // Metadata
    _source:      'standalone',
    _computedAt:  now.toISOString(),
  };
}

// ─── POST /api/automation/risk-check ──────────────────────────────────────────
app.post('/api/automation/risk-check', async (req, res) => {
  try {
    const {
      latitude  = 28.6139,
      longitude = 77.209,
      currentPremium = 129,
      workerId   = 'worker_001',
      workerName = 'Rider',
      zone       = 'India',
      platform   = 'Swiggy',
      coverageTier    = 'Standard',
      activeCoverage  = true,
    } = req.body;

    console.log(`\n[GigShield] ▶  Risk-check  worker=${workerId}  coords=[${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`);

    // Fetch live data in parallel
    const [weather, aqi] = await Promise.all([
      getRealWeather(latitude, longitude),
      getAQI(latitude, longitude),
    ]);

    if (weather) {
      console.log(`[GigShield]    Weather: ${weather.temperature}°C, ${weather.condition}, wind=${weather.windSpeed.toFixed(1)} km/h  [${weather.source}]`);
    }
    if (aqi) {
      console.log(`[GigShield]    AQI: ${aqi}/5`);
    }

    const risk   = computeRisk({ weather, aqi, basePremium: currentPremium });
    const result = buildResponse({
      worker: { workerId, workerName, zone, platform, coverageTier, activeCoverage },
      weather,
      aqi,
      risk,
    });

    console.log(`[GigShield] ✓  risk=${result.riskLevel}  confidence=${result.confidence}%  trigger=${result.lastTrigger}\n`);
    return res.status(200).json({ success: true, data: result });

  } catch (err) {
    console.error('[GigShield] Unexpected error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ─── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.listen(PORT, '0.0.0.0', () => {
  console.log('\n══════════════════════════════════════════════════════════');
  console.log(`🚀  GigShield Risk Server  →  http://127.0.0.1:${PORT}`);
  console.log(`✅  POST /api/automation/risk-check`);
  console.log(`🌤   Weather: ${WEATHER_API_KEY ? 'OpenWeatherMap (API key set)' : 'Open-Meteo (free, no key needed)'}`);
  console.log('══════════════════════════════════════════════════════════\n');
});
