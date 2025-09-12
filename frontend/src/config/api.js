// API configuration for backend communication
// Support environment variable override or smart fallback for Replit
export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 
  (window.location.origin.replace(':5000', ':8080'));