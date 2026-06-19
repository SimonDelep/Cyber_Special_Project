type OpenMeteoCurrent = {
  time: string;
  interval: number;
  temperature_2m: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  weather_code: number;
};

type OpenMeteoResponse = {
  current: OpenMeteoCurrent;
};

export type ChicoutimiWeather = {
  observedAt: string;
  temperatureC: number;
  windKmh: number;
  weatherCode: number;
  summaryFr: string;
};

function weatherCodeToFr(code: number): string {
  // Open-Meteo weather codes: https://open-meteo.com/en/docs
  switch (code) {
    case 0:
      return "Ciel dégagé";
    case 1:
    case 2:
    case 3:
      return "Partiellement nuageux";
    case 45:
    case 48:
      return "Brouillard";
    case 51:
    case 53:
    case 55:
      return "Bruine";
    case 56:
    case 57:
      return "Bruine verglaçante";
    case 61:
    case 63:
    case 65:
      return "Pluie";
    case 66:
    case 67:
      return "Pluie verglaçante";
    case 71:
    case 73:
    case 75:
      return "Neige";
    case 77:
      return "Grains de neige";
    case 80:
    case 81:
    case 82:
      return "Averses";
    case 85:
    case 86:
      return "Averses de neige";
    case 95:
      return "Orage";
    case 96:
    case 99:
      return "Orage avec grêle";
    default:
      return "Conditions variables";
  }
}

export async function getChicoutimiWeather(): Promise<ChicoutimiWeather> {
  // Chicoutimi (Saguenay, QC) approx coordinates.
  const latitude = 48.4284;
  const longitude = -71.0681;

  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${latitude}` +
    `&longitude=${longitude}` +
    `&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code` +
    `&timezone=America%2FToronto`;

  const res = await fetch(url, {
    // Cache on the server to avoid hammering the API.
    next: { revalidate: 60 * 15 }, // 15 minutes
  });

  if (!res.ok) {
    throw new Error(`WEATHER_API_ERROR_${res.status}`);
  }

  const data = (await res.json()) as OpenMeteoResponse;
  const current = data.current;
  if (!current || typeof current.temperature_2m !== "number") {
    throw new Error("WEATHER_API_INVALID_RESPONSE");
  }

  return {
    observedAt: current.time,
    temperatureC: current.temperature_2m,
    windKmh: current.wind_speed_10m,
    weatherCode: current.weather_code,
    summaryFr: weatherCodeToFr(current.weather_code),
  };
}

