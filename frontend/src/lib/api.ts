// API client for connecting to the Flask backend

// Get API base URL - use environment variable, or construct from current location
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Construct URL based on current location
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  // If we're on localhost, use localhost:8080
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8080';
  }
  
  // Otherwise, use the same protocol and hostname with port 8080
  return `${protocol}//${hostname}:8080`;
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

// Helper function to map backend wardrobe item to frontend format
const mapWardrobeItem = (item: BackendWardrobeItem): FrontendWardrobeItem => ({
  id: item.id.toString(),
  name: item.description || item.filename.replace(/\.[^/.]+$/, ""),
  image_url: item.file_url,
  fallback_text: item.description || `${item.filename} - Wardrobe item`
});

// API Client class
class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed:`, error);
      throw error;
    }
  }

  // Get all wardrobe items
  async listWardrobe(): Promise<FrontendWardrobeItem[]> {
    const response = await this.request<BackendWardrobeItem[]>('/wardrobe');
    return response.map(mapWardrobeItem);
  }

  // Upload wardrobe items
  async uploadWardrobe(files: File[]): Promise<FrontendWardrobeItem[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(`${API_BASE_URL}/wardrobe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();
    return data.uploaded.map(mapWardrobeItem);
  }

  // Delete a wardrobe item
  async deleteWardrobe(id: string): Promise<boolean> {
    try {
      await this.request(`/wardrobe/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('Delete failed:', error);
      return false;
    }
  }

  // Get outfit suggestions
  async suggestOutfits(params: {
    files?: File[];
    city?: string;
    hemisphere?: string;
    units?: string;
    date?: string;
  }): Promise<{
    recommendations: Array<{
      id?: string;
      suggestion_text: string;
      reason: string;
      image_url?: string;
      fallback_text?: string;
    }>;
    weather?: {
      season: string;
      condition: string;
    };
  }> {
    const formData = new FormData();
    
    // Add files if provided
    if (params.files) {
      params.files.forEach(file => {
        formData.append('files', file);
      });
    }

    // Add other parameters
    if (params.city) formData.append('city', params.city);
    if (params.hemisphere) formData.append('hemisphere', params.hemisphere);
    if (params.units) formData.append('units', params.units);
    if (params.date) formData.append('date', params.date);

    const response = await fetch(`${API_BASE_URL}/outfit`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Suggestions failed: ${response.status}`);
    }

    const data: SuggestionsResponse = await response.json();
    
    // Map backend response to frontend format
    const recommendations = data.suggestions.map(suggestion => ({
      id: suggestion.item?.id.toString(),
      suggestion_text: suggestion.item?.description || suggestion.fallback_text || 'AI-generated suggestion',
      reason: suggestion.reason,
      image_url: suggestion.item?.file_url,
      fallback_text: suggestion.fallback_text
    }));

    const weather = data.weather ? {
      season: data.season,
      condition: data.weather.weather?.[0]?.main || data.weather.weather?.[0]?.description || 'Unknown'
    } : undefined;

    return { recommendations, weather };
  }

  // Health check
  async healthCheck(): Promise<{ status: string; time: string }> {
    return this.request('/api/health');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export type { FrontendWardrobeItem };