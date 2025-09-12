import axios from 'axios';
import { API_BASE_URL } from '../config/api';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Wardrobe endpoints
  async uploadWardrobeItems(files) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    const response = await this.api.post('/wardrobe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getWardrobe() {
    const response = await this.api.get('/wardrobe');
    return response.data;
  }

  async deleteWardrobeItem(itemId) {
    const response = await this.api.delete(`/wardrobe/${itemId}`);
    return response.data;
  }

  // Outfit suggestion endpoint
  async getOutfitSuggestions(files, city = '', lat = null, lon = null) {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    if (city) formData.append('city', city);
    if (lat) formData.append('lat', lat.toString());
    if (lon) formData.append('lon', lon.toString());
    
    const response = await this.api.post('/outfit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Health check
  async healthCheck() {
    const response = await this.api.get('/');
    return response.data;
  }
}

export default new ApiService();