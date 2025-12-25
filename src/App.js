import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, Cloud, Droplets, Thermometer, Wind, Sun, 
  CloudRain, CloudLightning, Snowflake, Loader2, Sparkles,
  Moon, Sunrise, Sunset, Clock, CloudSun, CloudMoon,
  X, Gauge, Eye, ThermometerSnowflake, MapPin, RefreshCw,
  Calendar, Navigation, Wind as WindIcon, Zap, ShieldCheck
} from 'lucide-react';

// API Configuration
const apiKey = process.env.REACT_APP_WEATHER_API_KEY;
const geminiApiKey = ""; // Provided by environment

/**
 * Dynamic Wind Compass Component
 */
const WindCompass = ({ deg, size = "w-16 h-16" }) => (
  <div className={`relative ${size} rounded-full border-2 border-slate-700/50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm shadow-inner group`}>
    <div className="absolute inset-0 flex flex-col justify-between items-center py-1 select-none pointer-events-none">
      <span className="text-[8px] font-normal text-slate-500 group-hover:text-slate-300 transition-colors">N</span>
      <span className="text-[8px] font-normal text-slate-500 group-hover:text-slate-300 transition-colors">S</span>
    </div>
    <div className="absolute inset-0 flex justify-between items-center px-1 select-none pointer-events-none">
      <span className="text-[8px] font-normal text-slate-500 group-hover:text-slate-300 transition-colors">W</span>
      <span className="text-[8px] font-normal text-slate-500 group-hover:text-slate-300 transition-colors">E</span>
    </div>
    <div 
      className="relative w-full h-full flex items-center justify-center transition-transform duration-[1500ms] cubic-bezier(0.4, 0, 0.2, 1)"
      style={{ transform: `rotate(${deg}deg)` }}
    >
      <div className="w-1 h-7 bg-gradient-to-t from-emerald-500/20 via-emerald-400 to-emerald-400 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.6)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white ring-2 ring-emerald-500/50" />
    </div>
  </div>
);

const getWindDirection = (deg) => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(deg / 45) % 8;
  return directions[index];
};

const getAQIDesc = (aqi) => {
  const levels = ["Good", "Fair", "Moderate", "Poor", "Very Poor"];
  return levels[aqi - 1] || "Unknown";
};

const getAQIColor = (aqi) => {
  const colors = ["text-emerald-400", "text-yellow-400", "text-orange-400", "text-red-400", "text-purple-400"];
  return colors[aqi - 1] || "text-slate-400";
};

const TempGraph = ({ data, selectedIndex, isNight, title = "Temperature Trend" }) => {
  const [hoverData, setHoverData] = useState(null);
  const svgRef = useRef(null);

  if (!data || data.length === 0) return null;

  const width = 400;
  const height = 100;
  const padding = 20;

  const temps = data.map(d => d.main.temp);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const range = maxTemp - minTemp || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - ((d.main.temp - minTemp) / range) * (height - padding * 2) - padding;
    return { x, y, temp: d.main.temp, time: d.dt_txt };
  });

  const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;

  const handlePointerMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const x = clientX - rect.left;
    const svgWidth = rect.width;
    const relativeX = (x / svgWidth) * width;
    const clampedX = Math.max(padding, Math.min(width - padding, relativeX));
    const chartWidth = width - padding * 2;
    const rawIndex = ((clampedX - padding) / chartWidth) * (data.length - 1);
    const i0 = Math.floor(rawIndex);
    const i1 = Math.ceil(rawIndex);
    
    if (i0 === i1) {
      setHoverData({ x: points[i0].x, y: points[i0].y, temp: points[i0].temp, time: points[i0].time });
      return;
    }

    const p0 = points[i0];
    const p1 = points[i1];
    const t = (clampedX - p0.x) / (p1.x - p0.x);
    const interpolatedY = p0.y + t * (p1.y - p0.y);
    const interpolatedTemp = p0.temp + t * (p1.temp - p0.temp);

    setHoverData({ x: clampedX, y: interpolatedY, temp: interpolatedTemp, time: p0.time });
  };

  const activePoint = hoverData || (selectedIndex !== null ? points[selectedIndex] : null);

  return (
    <div className="w-full mt-6 mb-2">
      <div className="flex justify-between items-end mb-2">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">{title}</p>
        {hoverData && <p className="text-[10px] font-medium text-blue-400 animate-in fade-in slide-in-from-right-1">Tracking...</p>}
      </div>
      <svg 
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-24 overflow-visible cursor-crosshair touch-none"
        onMouseMove={handlePointerMove}
        onTouchMove={handlePointerMove}
        onMouseLeave={() => setHoverData(null)}
        onTouchEnd={() => setHoverData(null)}
      >
        <path d={`${pathData} L ${points[points.length-1].x},${height} L ${points[0].x},${height} Z`} fill={isNight ? 'rgba(129, 140, 248, 0.1)' : 'rgba(96, 165, 250, 0.1)'} className="transition-all duration-700" />
        <path d={pathData} fill="none" stroke={isNight ? '#818cf8' : '#60a5fa'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-700" />
        {activePoint && (
          <g className="transition-all duration-75">
            <line x1={activePoint.x} y1="0" x2={activePoint.x} y2={height} stroke={isNight ? 'rgba(129, 140, 248, 0.4)' : 'rgba(96, 165, 250, 0.4)'} strokeWidth="1.5" strokeDasharray="4" />
            <circle cx={activePoint.x} cy={activePoint.y} r="6" fill={isNight ? '#c084fc' : '#34d399'} />
            <g transform={`translate(${activePoint.x}, ${activePoint.y - 15})`}>
              <text textAnchor="middle" className={`text-[12px] font-medium fill-current ${isNight ? 'fill-indigo-100' : 'fill-blue-600'}`} style={{ paintOrder: 'stroke', stroke: isNight ? '#1e1b4b' : '#ffffff', strokeWidth: '3px', strokeLinejoin: 'round' }}>
                {activePoint.temp.toFixed(1)}°
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};

const StarryBackground = () => {
  const stars = useMemo(() => Array.from({ length: 150 }).map((_, i) => ({ id: i, top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, size: Math.random() * 2 + 1, delay: Math.random() * 5, duration: 3 + Math.random() * 4 })), []);
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <style>{`
        @keyframes comet-move { 0% { top: -5%; left: -5%; opacity: 0; transform: rotate(45deg) scale(0.5); } 5% { opacity: 1; } 50% { top: 110%; left: 110%; opacity: 0; transform: rotate(45deg) scale(1); } 100% { top: 110%; left: 110%; opacity: 0; } }
        .comet { position: absolute; width: 4px; height: 4px; background: white; border-radius: 50%; box-shadow: 0 0 15px 4px rgba(255, 255, 255, 0.8); animation: comet-move 15s linear infinite; }
        .comet::after { content: ''; position: absolute; top: 50%; right: 0; transform: translateY(-50%); width: 150px; height: 2px; background: linear-gradient(to left, rgba(255, 255, 255, 0.7), transparent); }
        @keyframes shooting-star { 0% { transform: translateX(0) translateY(0) rotate(-45deg) scale(0); opacity: 0; } 100% { transform: translateX(400px) translateY(400px) rotate(-45deg) scale(0); opacity: 0; } }
        .shooting-star { position: absolute; width: 2px; height: 2px; background: white; border-radius: 50%; animation: shooting-star 3s linear infinite; }
        @keyframes staggered-fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .staggered-item { opacity: 0; animation: staggered-fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
      {stars.map((star) => (
        <div key={star.id} className="absolute bg-white rounded-full opacity-0 animate-pulse" style={{ top: star.top, left: star.left, width: `${star.size}px`, height: `${star.size}px`, animationDelay: `${star.delay}s`, animationDuration: `${star.duration}s` }} />
      ))}
      <div className="comet" style={{ animationDelay: '2s' }} />
      <div className="shooting-star" style={{ top: '10%', left: '40%', animationDelay: '7s' }} />
    </div>
  );
};

const WeatherIcon = ({ type, isNight, className }) => {
  const weatherType = type?.toLowerCase();
  if (isNight) {
    switch (weatherType) {
      case 'clear': return <Moon className={className} />;
      case 'clouds': return <CloudMoon className={className} />;
      case 'mist': case 'haze': case 'fog': return <Moon className={className} />;
      case 'rain': case 'drizzle': return <CloudRain className={className} />;
      case 'thunderstorm': return <CloudLightning className={className} />;
      case 'snow': return <Snowflake className={className} />;
      default: return <Moon className={className} />;
    }
  }
  switch (weatherType) {
    case 'clear': return <Sun className={className} />;
    case 'clouds': return <CloudSun className={className} />;
    case 'mist': case 'haze': case 'fog': return <Cloud className={className} />;
    case 'rain': case 'drizzle': return <CloudRain className={className} />;
    case 'thunderstorm': return <CloudLightning className={className} />;
    case 'snow': return <Snowflake className={className} />;
    default: return <Sun className={className} />;
  }
};

export default function App() {
  useEffect(() => {
    console.log("ENV KEY:", process.env.REACT_APP_WEATHER_API_KEY);
  }, []);
  
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [aqiData, setAqiData] = useState(null);
  const [uvData, setUvData] = useState(null);
  const [fullForecast, setFullForecast] = useState([]);
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [dailyForecast, setDailyForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHourIndex, setSelectedHourIndex] = useState(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);
  const [liveTime, setLiveTime] = useState(new Date());

  const [aiInsight, setAiInsight] = useState("");
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchWithRetry = async (url, retries = 5, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url);
        if (response.ok) return await response.json();
        throw new Error("API Request Failed");
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
      }
    }
  };

  const generateAIInsight = async (weatherData) => {
    if (!geminiApiKey) return;
    setIsGeneratingInsight(true);
    const prompt = `Weather in ${weatherData.name}: ${weatherData.main.temp}°C, ${weatherData.weather[0].description}. Give witty 2-sentence advice.`;
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const result = await response.json();
      setAiInsight(result.candidates?.[0]?.content?.parts?.[0]?.text);
    } catch (err) { setAiInsight("Stay weather-ready!"); } finally { setIsGeneratingInsight(false); }
  };

  const fetchWeather = async (params) => {
    setLoading(true);
    setError(null);
    setSelectedHourIndex(null);
    setSelectedDayIndex(null);
    try {
      const query = typeof params === 'string' ? `q=${encodeURIComponent(params)}` : `lat=${params.lat}&lon=${params.lon}`;
      const commonParams = `${query}&appid=${apiKey}&units=metric`;
      
      const [weatherData, forecastData] = await Promise.all([
        fetchWithRetry(`https://api.openweathermap.org/data/2.5/weather?${commonParams}`),
        fetchWithRetry(`https://api.openweathermap.org/data/2.5/forecast?${commonParams}`)
      ]);

      setWeather(weatherData);
      setCity(weatherData.name);
      setFullForecast(forecastData.list);
      setHourlyForecast(forecastData.list.slice(0, 8));

      const { lat, lon } = weatherData.coord;
      const [aqi, uvi] = await Promise.all([
        fetchWithRetry(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`),
        fetchWithRetry(`https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${apiKey}`).catch(() => ({ value: 2.5 }))
      ]);

      setAqiData(aqi);
      setUvData(uvi);

      const processedDaily = [];
      const seenDates = new Set();
      const todayString = new Date().toLocaleDateString();

      for (const item of forecastData.list) {
        const date = new Date(item.dt * 1000).toLocaleDateString();
        if (date !== todayString && !seenDates.has(date) && processedDaily.length < 5) {
          seenDates.add(date);
          processedDaily.push(item);
        }
      }
      setDailyForecast(processedDaily);
      generateAIInsight(weatherData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => fetchWeather({ lat: position.coords.latitude, lon: position.coords.longitude }),
        () => fetchWeather('Bengaluru')
      );
    } else {
      fetchWeather('Bengaluru');
    }
  }, []);

  const isNightTime = useMemo(() => {
    if (!weather) return false;
    const now = Math.floor(liveTime.getTime() / 1000);
    return now < weather.sys.sunrise || now > weather.sys.sunset;
  }, [weather, liveTime]);

  const selectedHour = useMemo(() => {
    if (selectedHourIndex === null) return null;
    return hourlyForecast[selectedHourIndex];
  }, [selectedHourIndex, hourlyForecast]);

  const selectedDayData = useMemo(() => {
    if (selectedDayIndex === null) return null;
    const targetDate = new Date(dailyForecast[selectedDayIndex].dt * 1000).toLocaleDateString();
    return fullForecast.filter(item => new Date(item.dt * 1000).toLocaleDateString() === targetDate);
  }, [selectedDayIndex, dailyForecast, fullForecast]);

  const formatTime = (ts) => new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className={`relative min-h-screen transition-all duration-1000 p-4 md:p-8 font-sans overflow-x-hidden ${isNightTime ? 'bg-slate-950 text-indigo-50' : 'bg-slate-900 text-slate-100'}`}>
      
      {isNightTime && <StarryBackground />}

      <div className="relative z-10 max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-1000 ${isNightTime ? 'bg-indigo-600 shadow-indigo-500/30' : 'bg-blue-500 shadow-blue-500/30'}`}>
              <Cloud className="text-white h-7 w-7" />
            </div>
            <div>
              <h1 className={`text-3xl font-medium bg-gradient-to-r bg-clip-text text-transparent transition-all duration-1000 ${isNightTime ? 'from-indigo-400 to-purple-400' : 'from-blue-400 to-emerald-400'}`}>Weather Forecasting</h1>
              <div className="flex items-center gap-2 text-slate-400 text-sm font-normal">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p>Live Weather • {liveTime.toLocaleTimeString([], { hour12: false })}</p>
              </div>
            </div>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (city.trim()) fetchWeather(city); }} className="relative group">
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Search city..." className={`border rounded-full py-2.5 px-10 focus:outline-none focus:ring-2 w-full md:w-72 transition-all shadow-lg ${isNightTime ? 'bg-slate-900/80 border-indigo-900/50 text-indigo-100 focus:ring-indigo-50' : 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-blue-500'}`} />
            <Search className="absolute left-3 top-3 text-slate-500 h-5 w-5" />
            <button type="button" onClick={() => fetchWeather(city)} className="absolute right-3 top-3 text-slate-500 hover:text-blue-400 transition-colors">
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </form>
        </header>

        {/* Current Weather Card */}
        {weather && (
          <div className={`transition-all duration-1000 ${loading ? 'opacity-50 scale-[0.98]' : 'opacity-100 scale-100'}`}>
            <div className={`border rounded-3xl p-8 shadow-2xl overflow-hidden relative group transition-all duration-1000 backdrop-blur-xl ${isNightTime ? 'bg-indigo-950/40 border-indigo-500/20' : 'bg-slate-800/80 border-slate-700'}`}>
              <div className="absolute -top-10 -right-10 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <WeatherIcon type={weather.weather[0].main} isNight={isNightTime} className="w-80 h-80 transition-all duration-1000" />
              </div>
              <div className="relative z-10 grid lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5">
                  <div className="flex items-start gap-2 mb-2">
                    <MapPin className="h-6 w-6 text-blue-400 mt-2 shrink-0" />
                    <h2 className="text-6xl font-medium tracking-tight break-all text-white drop-shadow-sm">{weather.name}</h2>
                  </div>
                  <p className="text-2xl text-slate-400 capitalize mb-8 font-normal ml-8">{weather.weather[0].description}</p>
                  <div className="flex items-center gap-6 ml-8">
                    <span className="text-8xl font-normal tracking-tighter transition-all tabular-nums text-white drop-shadow-lg">{Math.round(weather.main.temp)}°C</span>
                    <WeatherIcon type={weather.weather[0].main} isNight={isNightTime} className={`w-24 h-24 transition-all duration-1000 ${isNightTime ? 'text-indigo-300' : 'text-blue-400'}`} />
                  </div>
                </div>

                <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: 'Humidity', val: `${weather.main.humidity}%`, Icon: Droplets, color: 'text-blue-400' },
                    { label: 'Feels Like', val: `${Math.round(weather.main.feels_like)}°C`, Icon: Thermometer, color: 'text-orange-400' },
                    { 
                      label: isNightTime ? 'Next Sunrise' : 'Next Sunset', 
                      val: formatTime(isNightTime ? weather.sys.sunrise : weather.sys.sunset), 
                      Icon: isNightTime ? Sunrise : Sunset, 
                      color: isNightTime ? 'text-yellow-500' : 'text-orange-500' 
                    },
                    { 
                      label: 'Air Quality', 
                      val: aqiData?.list ? getAQIDesc(aqiData.list[0].main.aqi) : '--', 
                      Icon: ShieldCheck, 
                      color: aqiData?.list ? getAQIColor(aqiData.list[0].main.aqi) : 'text-slate-400' 
                    },
                    { label: 'UV Index', val: uvData?.value || 'Low', Icon: Zap, color: 'text-purple-400' }
                  ].map((stat, i) => (
                    <div key={i} className={`backdrop-blur-md p-4 rounded-2xl flex flex-col gap-2 border transition-all hover:scale-105 duration-300 ${isNightTime ? 'bg-indigo-900/30 border-indigo-500/20' : 'bg-slate-700/40 border-slate-600/30'}`}>
                      <stat.Icon className={`${stat.color} h-6 w-6`} />
                      <div><p className="text-[10px] text-slate-400 uppercase font-medium tracking-widest leading-none mb-1">{stat.label}</p><p className="text-xl font-medium tabular-nums text-white">{stat.val}</p></div>
                    </div>
                  ))}
                  <div className={`backdrop-blur-md p-4 rounded-2xl flex items-center gap-4 col-span-2 md:col-span-1 border transition-all hover:scale-[1.02] duration-300 ${isNightTime ? 'bg-indigo-950/60 border-indigo-500/40' : 'bg-slate-700/60 border-slate-600/50'}`}>
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-400 uppercase font-medium tracking-widest leading-none mb-2">Wind</p>
                      <p className="text-xl font-medium text-white">{weather.wind?.speed} m/s</p>
                      <p className="text-[10px] font-normal text-emerald-300 uppercase">{getWindDirection(weather.wind?.deg || 0)}</p>
                    </div>
                    <WindCompass deg={weather.wind?.deg || 0} size="w-12 h-12" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Next 24 Hours */}
        {hourlyForecast.length > 0 && (
          <section>
            <h3 className="text-xl font-medium mb-4 px-2 flex items-center gap-2"><Clock className="h-5 w-5 text-slate-400" />Next 24 Hours</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
              {hourlyForecast.map((item, index) => {
                const timeStr = new Date(item.dt_txt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                const isHourNight = item.sys?.pod === 'n';
                return (
                  <button key={index} onClick={() => setSelectedHourIndex(index)} style={{ animationDelay: `${index * 50}ms` }} className={`staggered-item flex-shrink-0 w-28 p-4 rounded-2xl border text-center transition-all transform hover:-translate-y-2 active:scale-95 backdrop-blur-sm group ${isNightTime ? 'bg-indigo-950/30 border-indigo-900/40 hover:bg-indigo-900/60' : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/80'}`}>
                    <p className="text-xs font-normal text-slate-400 mb-2">{timeStr}</p>
                    <WeatherIcon type={item.weather[0].main} isNight={isHourNight} className={`w-8 h-8 mx-auto mb-2 group-hover:scale-125 transition-transform duration-300 ${isHourNight ? 'text-indigo-300' : 'text-slate-100'}`} />
                    <p className="text-xl font-medium tabular-nums text-white">{Math.round(item.main.temp)}°</p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* 5-Day Forecast */}
        {dailyForecast.length > 0 && (
          <section>
            <h3 className="text-2xl font-medium mb-6 px-2 flex items-center gap-3">5-Day Forecast<div className={`h-px flex-1 transition-all duration-1000 ${isNightTime ? 'bg-indigo-900' : 'bg-slate-800'}`}></div></h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              {dailyForecast.map((item, index) => {
                const date = new Date(item.dt * 1000);
                return (
                  <button key={index} onClick={() => setSelectedDayIndex(index)} style={{ animationDelay: `${(index + 8) * 50}ms` }} className={`staggered-item border p-6 rounded-3xl text-center transition-all duration-500 backdrop-blur-sm transform hover:-translate-y-2 group flex flex-col items-center ${isNightTime ? 'bg-indigo-950/30 border-indigo-900/50 hover:border-indigo-500/50 hover:bg-indigo-900/40' : 'bg-slate-800 border-slate-700 hover:border-blue-500/50 hover:bg-slate-700/80'}`}>
                    <p className={`text-sm font-medium mb-1 ${isNightTime ? 'text-indigo-400' : 'text-blue-400'}`}>{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                    <p className="text-slate-500 text-[10px] uppercase mb-4 tracking-wider font-normal">{date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</p>
                    <WeatherIcon type={item.weather[0].main} isNight={false} className="w-12 h-12 mx-auto mb-4 text-slate-200 group-hover:scale-110 transition-transform duration-300" />
                    <p className="text-3xl font-medium mb-2 tabular-nums text-white">{Math.round(item.main.temp)}°</p>
                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 font-normal"><Droplets className="h-3 w-3" /><span>{item.main.humidity}%</span></div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Selected Hour/Day Modal */}
        {(selectedHour || (selectedDayData && selectedDayData.length > 0)) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className={`relative w-full max-w-lg rounded-3xl p-8 shadow-2xl border transition-all transform animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 ${isNightTime ? 'bg-indigo-950/90 border-indigo-500/30 text-indigo-50' : 'bg-slate-800/95 border-slate-700 text-white'}`}>
              <button onClick={() => { setSelectedHourIndex(null); setSelectedDayIndex(null); }} className="absolute top-6 right-6 p-2 rounded-full bg-slate-700/50 hover:bg-slate-600 transition-all hover:rotate-90"><X className="h-5 w-5" /></button>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-1">{selectedDayIndex !== null ? "Full Day Forecast" : "Detailed Forecast"}</p>
                  <h4 className="text-3xl font-bold text-white">
                    {selectedDayIndex !== null 
                      ? new Date(dailyForecast[selectedDayIndex].dt * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) 
                      : new Date(selectedHour?.dt_txt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
                    }
                  </h4>
                  <p className="text-slate-400 capitalize font-normal">{selectedDayIndex !== null ? "Conditions throughout the day" : selectedHour?.weather[0].description}</p>
                </div>
                <WeatherIcon type={(selectedDayData?.[0] || selectedHour)?.weather[0].main} isNight={selectedDayIndex === null ? selectedHour?.sys?.pod === 'n' : false} className="w-16 h-16 text-blue-400" />
              </div>
              <TempGraph data={selectedDayData || hourlyForecast} selectedIndex={selectedDayIndex !== null ? -1 : selectedHourIndex} isNight={isNightTime} title={selectedDayIndex !== null ? "Day Trend (Hourly)" : "Temperature Trend (24h)"} />
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 flex items-center gap-3">
                  <Thermometer className="text-red-400 h-5 w-5" />
                  <div><p className="text-[10px] uppercase text-slate-500 font-medium tracking-tighter">High</p><p className="font-semibold tabular-nums text-white">{Math.round(Math.max(...(selectedDayData || [selectedHour]).map(d => d?.main.temp)))}°C</p></div>
                </div>
                <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 flex items-center gap-3">
                  <ThermometerSnowflake className="text-blue-400 h-5 w-5" />
                  <div><p className="text-[10px] uppercase text-slate-500 font-medium tracking-tighter">Low</p><p className="font-semibold tabular-nums text-white">{Math.round(Math.min(...(selectedDayData || [selectedHour]).map(d => d?.main.temp)))}°C</p></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="text-center py-10 text-slate-500 text-sm font-normal">
          <p>Data provided by OpenWeatherMap API </p>
          <p className="opacity-50 mt-1">Weather Forecast Interface • v2.1</p>
        </footer>
      </div>
    </div>
  );
}
