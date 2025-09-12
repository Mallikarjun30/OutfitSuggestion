// API client for connecting to the Flask backend

// Get API base URL - use environment variable or relative paths (same-origin)
const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_URL || '';
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

// Helper function to extract a clean name from the AI description
const extractItemName = (description: string): string => {
  if (!description) return "Clothing Item";
  
  // Try to extract clothing type from structured description
  const typeMatch = description.match(/TYPE:\s*([^,\n]+)/i);
  if (typeMatch) {
    return typeMatch[1].replace(/_/g, ' ').trim();
  }
  
  // Try to extract first line that looks like an item type
  const lines = description.split('\n');
  for (const line of lines) {
    const cleanLine = line.trim().replace(/[:\-*]/g, '');
    if (cleanLine.length > 0 && cleanLine.length < 50 && 
        /^[A-Z][A-Z\s_-]+$/.test(cleanLine)) {
      return cleanLine.replace(/_/g, ' ').toLowerCase()
        .replace(/\b\w/g, l => l.toUpperCase());
    }
  }
  
  // Fallback to generic name based on common clothing terms
  const clothingTerms = ['shirt', 't-shirt', 'jeans', 'pants', 'dress', 'jacket', 'hoodie', 'sweater', 'skirt', 'shorts', 'blouse', 'top', 'bottom', 'hat', 'cap', 'beanie'];
  const lowerDesc = description.toLowerCase();
  
  for (const term of clothingTerms) {
    if (lowerDesc.includes(term)) {
      return term.charAt(0).toUpperCase() + term.slice(1);
    }
  }
  
  return "Clothing Item";
};

// Helper function to extract category from the AI description
const extractItemCategory = (description: string): string => {
  if (!description) return "Other";
  
  const lowerDesc = description.toLowerCase();
  
  // Define category mappings
  const categoryMappings = {
    'Tops': ['shirt', 't-shirt', 'blouse', 'top', 'tank', 'crop', 'cardigan', 'sweater', 'hoodie', 'jacket', 'blazer', 'coat'],
    'Bottoms': ['jeans', 'pants', 'trousers', 'shorts', 'skirt', 'dress', 'leggings', 'joggers'],
    'Outerwear': ['jacket', 'coat', 'blazer', 'cardigan', 'vest', 'outerwear'],
    'Accessories': ['hat', 'cap', 'beanie', 'scarf', 'belt', 'bag', 'watch', 'jewelry', 'sunglasses'],
    'Footwear': ['shoes', 'boots', 'sneakers', 'sandals', 'heels', 'flats']
  };
  
  // Check each category
  for (const [category, terms] of Object.entries(categoryMappings)) {
    for (const term of terms) {
      if (lowerDesc.includes(term)) {
        return category;
      }
    }
  }
  
  return "Other";
};

// Helper function to map backend wardrobe item to frontend format
const mapWardrobeItem = (item: BackendWardrobeItem): FrontendWardrobeItem => ({
  id: item.id.toString(),
  name: extractItemName(item.description || ''),
  image_url: item.file_url,
  fallback_text: item.description || `${item.filename} - Wardrobe item`,
  category: extractItemCategory(item.description || '')
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
    const recommendations = data.suggestions.map((suggestion, index) => ({
      id: suggestion.wardrobe_id?.toString() || `suggestion-${index}`,
      suggestion_text: extractItemName(suggestion.item?.description || '') || suggestion.fallback_text || 'AI-generated suggestion',
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