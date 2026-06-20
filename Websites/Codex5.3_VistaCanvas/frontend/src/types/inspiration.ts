export interface ApodItem {
  title: string;
  explanation: string;
  image_url: string | null;
  page_url: string;
  date: string;
  copyright: string | null;
  source: string;
}

export interface ScenicWeather {
  location: string;
  temperature_c: number;
  weather_label: string;
  wind_speed_kmh: number;
  sunrise: string | null;
  sunset: string | null;
}

export interface NatureQuote {
  content: string;
  author: string;
  source: string;
}

export interface InspirationFeed {
  apod: ApodItem | null;
  scenic_weather: ScenicWeather[];
  quote: NatureQuote | null;
  apod_error: string | null;
  weather_error: string | null;
  quote_error: string | null;
}
