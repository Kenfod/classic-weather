import React, { useState, useEffect } from "react";

function getWeatherIcon(wmoCode) {
  const icons = {
    0: "☀️",
    1: "🌤️",
    2: "⛅",
    3: "☁️",
    45: "🌫️",
    48: "🌫️",
    51: "🌦️",
    53: "🌧️",
    55: "🌧️",
    56: "🌦️",
    57: "🌧️",
    61: "🌦️",
    63: "🌧️",
    65: "🌧️",
    66: "🌦️",
    67: "🌧️",
    71: "🌨️",
    73: "🌨️",
    75: "🌨️",
    77: "🌨️",
    80: "🌦️",
    81: "🌧️",
    82: "🌧️",
    85: "🌨️",
    86: "🌨️",
    95: "🌩️",
    96: "⛈️",
    99: "⛈️",
  };

  return icons[wmoCode] || "❓";
}

function CountryFlag({ countryCode }) {
  if (!countryCode) return null;

  const code = countryCode.toLowerCase();

  return (
    <img
      className="flag"
      src={`https://flagcdn.com/w40/${code}.png`}
      width={40}
      height={30}
      alt={`${countryCode} flag`}
      style={{
        marginLeft: "10px",
        verticalAlign: "middle",
        objectFit: "contain",
      }}
    />
  );
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
  }).format(new Date(dateStr));
}

const AppStyles = () => (
  <style>{`
    .app {
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      font-family: system-ui, sans-serif;
      text-align: center;
      background: #f7f9fa;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }

    h1 {
      color: #2c3e50;
      font-size: 2.5rem;
      margin-bottom: 20px;
    }

    input {
      padding: 12px 20px;
      width: 60%;
      max-width: 400px;
      font-size: 1rem;
      border: 2px solid #cbd5e1;
      border-radius: 8px;
      outline: none;
      transition: border 0.2s;
    }

    input:focus {
      border-color: #3b82f6;
    }

    .loader {
      font-size: 1.2rem;
      color: #64748b;
      margin-top: 20px;
      animation: pulse 1.5s infinite;
    }

    .error-msg {
      background: #fee2e2;
      color: #ef4444;
      border: 1px solid #fca5a5;
      padding: 12px;
      margin: 20px auto;
      border-radius: 8px;
      width: fit-content;
      max-width: 80%;
    }

    .weather-container {
      margin-top: 30px;
      animation: fadeIn 0.4s ease-out;
    }

    .weather-title {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #1e293b;
    }

    .weather-list {
      display: flex;
      gap: 15px;
      justify-content: center;
      list-style: none;
      padding: 0;
      margin-top: 20px;
      overflow-x: auto;
    }

    .day-card {
      background: white;
      padding: 20px;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      min-width: 90px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.02);
    }

    .day-icon {
      font-size: 2rem;
      display: block;
      margin-bottom: 8px;
    }

    .day-name {
      font-weight: 600;
      color: #475569;
      margin: 4px 0;
    }

    .day-temp {
      color: #64748b;
      font-size: 0.9rem;
      margin: 0;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }

      50% {
        opacity: .5;
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `}</style>
);

function App() {
  const [location, setLocation] = useState(
    () => localStorage.getItem("location") || "",
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [displayLocationName, setDisplayLocationName] = useState("");
  const [displayLocationCountryCode, setDisplayLocationCountryCode] =
    useState("");

  const [weather, setWeather] = useState({});

  useEffect(() => {
    if (location.trim().length < 2) {
      setWeather({});
      setError(null);
      return;
    }

    const controller = new AbortController();

    async function fetchWeather() {
      try {
        setIsLoading(true);
        setError(null);

        // 1. Get location coordinates
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            location,
          )}`,
          {
            signal: controller.signal,
          },
        );

        if (!geoRes.ok) {
          throw new Error("Failed to find location.");
        }

        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
          throw new Error(`Could not find "${location}"`);
        }

        const { latitude, longitude, timezone, name, country_code } =
          geoData.results[0];

        setDisplayLocationName(name);
        setDisplayLocationCountryCode(country_code);

        // 2. Get weather
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${encodeURIComponent(
            timezone,
          )}&daily=weathercode,temperature_2m_max,temperature_2m_min`,
          {
            signal: controller.signal,
          },
        );

        if (!weatherRes.ok) {
          throw new Error("Failed to fetch weather data.");
        }

        const weatherData = await weatherRes.json();

        setWeather(weatherData.daily);

        localStorage.setItem("location", location);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err);
          setError(err.message);
          setWeather({});
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchWeather();

    return () => controller.abort();
  }, [location]);

  return (
    <div className="app">
      <AppStyles />

      <h1>Classic Weather</h1>

      <Input
        location={location}
        onChangeLocation={(e) => setLocation(e.target.value)}
      />

      {isLoading && <p className="loader">Loading weather metrics...</p>}

      {error && <div className="error-msg">⚠️ {error}</div>}

      {!isLoading && !error && weather.weathercode && displayLocationName && (
        <Weather
          weather={weather}
          locationName={displayLocationName}
          locationCountryCode={displayLocationCountryCode}
        />
      )}
    </div>
  );
}

export default App;

function Input({ location, onChangeLocation }) {
  return (
    <div>
      <input
        type="text"
        placeholder="Search for location..."
        value={location}
        onChange={onChangeLocation}
      />
    </div>
  );
}

function Weather({ weather, locationName, locationCountryCode }) {
  const {
    temperature_2m_max: max,
    temperature_2m_min: min,
    time: dates,
    weathercode: codes,
  } = weather;

  return (
    <div className="weather-container">
      <h2 className="weather-title">
        Weather for {locationName}
        <CountryFlag countryCode={locationCountryCode} />
      </h2>

      <ul className="weather-list">
        {dates.map((date, i) => (
          <Day
            date={date}
            max={max.at(i)}
            min={min.at(i)}
            code={codes.at(i)}
            key={date}
            isToday={i === 0}
          />
        ))}
      </ul>
    </div>
  );
}

function Day({ date, max, min, code, isToday }) {
  return (
    <li className="day-card">
      <span className="day-icon">{getWeatherIcon(code)}</span>

      <p className="day-name">{isToday ? "Today" : formatDay(date)}</p>

      <p className="day-temp">
        {Math.floor(min)}&deg; &mdash; <strong>{Math.ceil(max)}&deg;</strong>
      </p>
    </li>
  );
}
