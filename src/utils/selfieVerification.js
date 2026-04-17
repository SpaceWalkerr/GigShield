export async function getCurrentLocation({ timeoutMs = 8000 } = {}) {
  if (!("geolocation" in navigator)) {
    return { ok: false, error: "Geolocation unavailable", coords: null };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          ok: true,
          error: "",
          coords: {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            accuracyM: position.coords.accuracy,
          },
        });
      },
      (error) => {
        const message =
          error?.code === error.PERMISSION_DENIED
            ? "Location permission denied"
            : error?.message || "Failed to get location";
        resolve({ ok: false, error: message, coords: null });
      },
      {
        enableHighAccuracy: false,
        maximumAge: 60_000,
        timeout: timeoutMs,
      },
    );
  });
}

export async function getCurrentWeather({ lat, lon, timeoutMs = 8000 }) {
  if (typeof lat !== "number" || typeof lon !== "number") {
    return { ok: false, error: "Missing coordinates", weather: null };
  }

  const primary = await fetchOpenMeteo({ lat, lon, timeoutMs });
  if (primary.ok) {
    return primary;
  }

  const secondary = await fetchWttr({ lat, lon, timeoutMs });
  if (secondary.ok) {
    return {
      ...secondary,
      weather: {
        ...secondary.weather,
        reliability: "fallback",
      },
    };
  }

  return {
    ok: false,
    error: `${primary.error}; ${secondary.error}`,
    weather: null,
  };
}

async function fetchOpenMeteo({ lat, lon, timeoutMs }) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set("current", "temperature_2m,wind_speed_10m");
    url.searchParams.set("timezone", "auto");

    const response = await fetch(url.toString(), { signal: controller.signal });
    if (!response.ok) {
      return {
        ok: false,
        error: `Open-Meteo failed (${response.status})`,
        weather: null,
      };
    }

    const data = await response.json();
    const current = data?.current;

    return {
      ok: true,
      error: "",
      weather: {
        tempC: typeof current?.temperature_2m === "number" ? current.temperature_2m : null,
        windKmph: typeof current?.wind_speed_10m === "number" ? current.wind_speed_10m : null,
        measuredAt: typeof current?.time === "string" ? current.time : "",
        source: "open-meteo",
        reliability: "primary",
      },
    };
  } catch (error) {
    const message =
      error?.name === "AbortError" ? "Open-Meteo timed out" : "Open-Meteo request failed";
    return { ok: false, error: message, weather: null };
  } finally {
    window.clearTimeout(timer);
  }
}

async function fetchWttr({ lat, lon, timeoutMs }) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`https://wttr.in/${lat},${lon}?format=j1`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      return {
        ok: false,
        error: `wttr failed (${response.status})`,
        weather: null,
      };
    }

    const data = await response.json();
    const current = Array.isArray(data?.current_condition) ? data.current_condition[0] : null;

    return {
      ok: true,
      error: "",
      weather: {
        tempC: current?.temp_C != null ? Number(current.temp_C) : null,
        windKmph: current?.windspeedKmph != null ? Number(current.windspeedKmph) : null,
        measuredAt: new Date().toISOString(),
        source: "wttr",
      },
    };
  } catch (error) {
    const message = error?.name === "AbortError" ? "wttr timed out" : "wttr request failed";
    return { ok: false, error: message, weather: null };
  } finally {
    window.clearTimeout(timer);
  }
}

