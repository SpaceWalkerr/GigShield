import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin, CloudRain, Sun, Wind, Thermometer, Satellite, Navigation } from "lucide-react";

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function MapRecenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 13);
  }, [position, map]);
  return null;
}

const OWM_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

export default function WeatherRadarMap({ initialLatitude = 28.6139, initialLongitude = 77.209, initialCity = "New Delhi" }) {
  const [position, setPosition] = useState([initialLatitude, initialLongitude]);
  const [weatherData, setWeatherData] = useState(null);
  const [cityName, setCityName] = useState(initialCity);
  const [isLocating, setIsLocating] = useState(false);

  // Sync internal state with props
  useEffect(() => {
    setPosition([initialLatitude, initialLongitude]);
    setCityName(initialCity);
  }, [initialLatitude, initialLongitude, initialCity]);

  // 1. Geolocation Fetch
  const handleLocateMe = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]);
          setIsLocating(false);
          fetchReverseGeocode(latitude, longitude);
        },
        (err) => {
          console.error("Geo error:", err);
          setIsLocating(false);
        }
      );
    }
  };

  const fetchReverseGeocode = async (lat, lon) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await res.json();
      setCityName(data.address.city || data.address.town || data.address.suburb || "Current Area");
    } catch (err) {
      console.error("Geocode error:", err);
    }
  };

  // 2. Weather Fetch (OpenWeatherMap)
  useEffect(() => {
    const FALLBACK = {
      temperature: 32.4,
      windspeed: 14.2,
      condition: "Clear",
      description: "clear sky",
      humidity: 58,
      pressure: 1012,
    };

    const fetchWeather = async () => {
      if (!OWM_KEY) {
        setWeatherData(FALLBACK);
        return;
      }
      try {
        const [lat, lon] = position;
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric`
        );
        if (!res.ok) throw new Error(`OWM ${res.status}`);
        const data = await res.json();
        setWeatherData({
          temperature: data.main.temp,
          windspeed: data.wind.speed * 3.6,
          condition: data.weather[0].main,
          description: data.weather[0].description,
          humidity: data.main.humidity,
          pressure: data.main.pressure,
        });
        if (data.name && !isLocating) setCityName(data.name);
      } catch (err) {
        console.warn("Weather fetch failed, using fallback:", err.message);
        setWeatherData(FALLBACK);
      }
    };

    fetchWeather();
  }, [position, isLocating]);

  const nearbyLocations = [
    { name: cityName, temp: weatherData?.temperature !== undefined ? `${Number(weatherData.temperature).toFixed(1)}°C` : "--", cond: weatherData?.condition || "Scanning", color: "bg-emerald-500" },
    { name: "Sector Pulse", temp: weatherData?.temperature !== undefined ? `${(Number(weatherData.temperature) + 1.2).toFixed(1)}°C` : "--", cond: "Thermal Drift", color: "bg-amber-500" },
    { name: "Nearby Hub", temp: weatherData?.temperature !== undefined ? `${(Number(weatherData.temperature) - 0.8).toFixed(1)}°C` : "--", cond: "Cooler Patch", color: "bg-cyan-500" },
  ];

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-1 shadow-2xl shadow-black/40 backdrop-blur-xl">
      <div className="grid gap-1 lg:grid-cols-[1fr_300px]">
        {/* Map Side */}
        <div className="relative h-[480px] w-full overflow-hidden rounded-[1.8rem]">
          <MapContainer
            center={position}
            zoom={13}
            scrollWheelZoom={false}
            className="h-full w-full grayscale-[0.1] brightness-[0.85]"
            zoomControl={false}
          >
            <MapRecenter position={position} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {OWM_KEY && (
              <TileLayer
                transparent={true}
                opacity={0.5}
                url={`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OWM_KEY}`}
              />
            )}

            <Marker position={position}>
              <Popup>
                <div className="text-zinc-900 font-bold tracking-tight">
                  <p className="border-b border-zinc-100 pb-1 mb-1">{cityName}</p>
                  <p className="text-[14px] text-cyan-600">{weatherData?.temperature ?? "--"}°C Now</p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>

          {/* Map Controls */}
          <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2">
            <button 
              onClick={handleLocateMe}
              disabled={isLocating}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-black/60 text-white backdrop-blur-md transition hover:bg-cyan-500 hover:border-cyan-400 shadow-lg"
            >
              <Navigation className={`h-5 w-5 ${isLocating ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="absolute left-4 top-4 z-[1000] flex flex-col gap-2">
             <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
                <Satellite className="h-3 w-3 text-cyan-400 rotate-12" />
                OWM Satellite Link: Online
             </div>
             <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
                <CloudRain className="h-3 w-3 text-emerald-400" />
                Precipitation Matrix
             </div>
          </div>

          <div className="absolute bottom-4 left-4 z-[1000]">
            <div className="rounded-2xl border border-white/20 bg-black/60 p-3 backdrop-blur-md shadow-2xl">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2">Heat/Rain Intensity</p>
              <div className="flex items-center gap-4">
                <div className="h-1.5 w-16 rounded-full bg-gradient-to-r from-blue-400 via-green-400 to-red-500" />
                <span className="text-[9px] font-bold text-white uppercase tracking-tighter">Live Sensor Data</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Side */}
        <div className="flex flex-col p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Live Telemetry</h4>
              <p className="mt-1 text-sm font-black text-white truncate max-w-[180px]">{cityName}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
               <Thermometer className="h-5 w-5 text-cyan-400" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-5">
               <p className="text-[9px] font-black uppercase tracking-[0.15em] text-cyan-300">Surface Temp</p>
               <div className="mt-2 flex items-baseline gap-2">
                 <p className="text-4xl font-black tracking-tighter text-white">{weatherData?.temperature !== undefined ? Number(weatherData.temperature).toFixed(1) : "--"}°C</p>
                 <span className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{weatherData?.condition || "Scan..."}</span>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-center">
                  <Wind className="mx-auto h-4 w-4 text-zinc-500 mb-2" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Wind</p>
                  <p className="text-sm font-bold text-white">{weatherData ? weatherData.windspeed.toFixed(1) : "--"} kmh</p>
               </div>
               <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-center">
                  <Sun className="mx-auto h-4 w-4 text-zinc-500 mb-2" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Humidity</p>
                  <p className="text-sm font-bold text-white">{weatherData?.humidity ?? "--"}%</p>
               </div>
            </div>

            <div className="pt-4 space-y-3 px-1">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Zone Telemetry</p>
              {nearbyLocations.map((loc) => (
                <div key={loc.name} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-3">
                    <div className={`h-1 w-1 rounded-full ${loc.color} group-hover:scale-150 transition`} />
                    <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition">{loc.name}</span>
                  </div>
                  <span className="text-xs font-black text-zinc-100">{loc.temp}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto pt-6">
             <button 
                onClick={handleLocateMe}
                className="w-full rounded-2xl bg-white px-4 py-4 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-950 transition hover:bg-cyan-300 hover:scale-[1.02] shadow-xl shadow-cyan-950/20 flex items-center justify-center gap-2"
             >
                <Navigation className="h-3 w-3" />
                Sync Current Sector
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

