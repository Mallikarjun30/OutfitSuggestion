// API client for connecting to the Flask backend

const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_URL || "";
};

const API_BASE_URL = getApiBaseUrl();

interface BackendWardrobeItem {
  id: number;
  filename: string;
  file_url: string;
  description: string;
  created_at: number;
}

interface FrontendWardrobeItem {
  id: string;
  name: string;
  image_url?: string;
  fallback_text?: string;
  category: string;
}

interface OutfitSuggestion {
  wardrobe_id: number | null;
  reason: string;
  fallback_text?: string;
  item?: BackendWardrobeItem;
}

interface SuggestionsResponse {
  outfit_descriptions: string[];
  season: string;
  weather: any;
  suggestions_raw: string;
  suggestions: OutfitSuggestion[];
  notes?: string;
}

// === Helpers ===

const extractItemName = (description: string): string => {
  if (!description) return "Clothing Item";
  const typeMatch = description.match(/TYPE:\s*([^,\n]+)/i);
  if (typeMatch) return typeMatch[1].replace(/_/g, " ").trim();

  const lines = description.split("\n");
  for (const line of lines) {
    const cleanLine = line.trim().replace(/[:\-*]/g, "");
    if (cleanLine.length > 0 && cleanLine.length < 50 && /^[A-Z][A-Z\s_-]+$/.test(cleanLine)) {
      return cleanLine.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
    }
  }

  const clothingTerms = ["shirt", "t-shirt", "jeans", "pants", "dress", "jacket", "hoodie", "sweater", "skirt", "shorts", "blouse", "top", "bottom", "hat", "cap", "beanie"];
  const lowerDesc = description.toLowerCase();
  for (const term of clothingTerms) {
    if (lowerDesc.includes(term)) return term.charAt(0).toUpperCase() + term.slice(1);
  }
  return "Clothing Item";
};

const extractItemCategory = (description: string): string => {
  if (!description) return "Other";
  const lowerDesc = description.toLowerCase();
  const categoryMappings = {
    Tops: ["shirt", "t-shirt", "blouse", "top", "tank", "crop", "cardigan", "sweater", "hoodie", "jacket", "blazer", "coat"],
    Bottoms: ["jeans", "pants", "trousers", "shorts", "skirt", "dress", "leggings", "joggers"],
    Outerwear: ["jacket", "coat", "blazer", "cardigan", "vest", "outerwear"],
    Accessories: ["hat", "cap", "beanie", "scarf", "belt", "bag", "watch", "jewelry", "sunglasses"],
    Footwear: ["shoes", "boots", "sneakers", "sandals", "heels", "flats"],
  };

  for (const [category, terms] of Object.entries(categoryMappings)) {
    if (terms.some((t) => lowerDesc.includes(t))) return category;
  }
  return "Other";
};

const mapWardrobeItem = (item: BackendWardrobeItem): FrontendWardrobeItem => ({
  id: item.id.toString(),
  name: extractItemName(item.description || ""),
  image_url: item.file_url,
  fallback_text: item.description || `${item.filename} - Wardrobe item`,
  category: extractItemCategory(item.description || ""),
});

// === API Client ===

class ApiClient {
  private getAuthToken(): string | null {
    return localStorage.getItem("auth_token"); // ✅ make sure Login.tsx uses same key
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = this.getAuthToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (options.body && typeof options.body === "string") headers["Content-Type"] = "application/json";

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include", // ✅ THIS is critical for sending cookies
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      window.location.href = "/login";
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

  async listWardrobe(): Promise<FrontendWardrobeItem[]> {
    const response = await this.request<BackendWardrobeItem[]>("/wardrobe");
    return response.map(mapWardrobeItem);
  }

  async uploadWardrobe(files: File[]): Promise<FrontendWardrobeItem[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return this.request("/wardrobe", { method: "POST", body: formData });
  }

  async deleteWardrobe(id: string): Promise<boolean> {
    await this.request(`/wardrobe/${id}`, { method: "DELETE" });
    return true;
  }

  async suggestOutfits(params: {
    files?: File[];
    city?: string;
    hemisphere?: string;
    units?: string;
    date?: string;
    profile?: { gender: string; skinTone: string };
  }) {
    const formData = new FormData();
    params.files?.forEach((file) => formData.append("files", file));
    if (params.city) formData.append("city", params.city);
    if (params.hemisphere) formData.append("hemisphere", params.hemisphere);
    if (params.units) formData.append("units", params.units);
    if (params.date) formData.append("date", params.date);
    if (params.profile) {
      formData.append("gender", params.profile.gender);
      formData.append("skin_tone", params.profile.skinTone);
    }

    const data: SuggestionsResponse = await this.request("/outfit", { method: "POST", body: formData });

    const recommendations = data.suggestions.map((suggestion, i) => ({
      id: suggestion.wardrobe_id?.toString() || `suggestion-${i}`,
      suggestion_text: extractItemName(suggestion.item?.description || "") || suggestion.fallback_text || "AI suggestion",
      reason: suggestion.reason,
      image_url: suggestion.item?.file_url,
      fallback_text: suggestion.fallback_text,
    }));

    const weather = data.weather
      ? {
          season: data.season,
          condition: data.weather.weather?.[0]?.main || data.weather.weather?.[0]?.description || "Unknown",
        }
      : undefined;

    return { recommendations, weather };
  }

  async healthCheck() {
    return this.request<{ status: string; time: string }>("/api/health");
  }
}

export const apiClient = new ApiClient();
export type { FrontendWardrobeItem };
