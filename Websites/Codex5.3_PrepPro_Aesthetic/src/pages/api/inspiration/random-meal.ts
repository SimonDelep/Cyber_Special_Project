import type { APIRoute } from "astro";
import { fetchRandomMeal } from "@/lib/open-api/themealdb";
import { errorResponse, jsonResponse } from "@/lib/api/response";

export const GET: APIRoute = async () => {
  try {
    const meal = await fetchRandomMeal();
    if (!meal) {
      return errorResponse("Could not load meal inspiration right now.", 502);
    }
    return jsonResponse({ meal, provider: "TheMealDB" });
  } catch {
    return errorResponse("Could not load meal inspiration right now.", 502);
  }
};
