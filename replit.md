# Overview

AI Wardrobe Stylist is a full-stack web application that helps users organize their wardrobe and get AI-powered outfit suggestions based on weather conditions. The system combines computer vision, AI analysis, and real-time weather data to provide personalized fashion recommendations.

The application allows users to upload clothing items to their digital wardrobe, automatically generates descriptions using Google's Gemini AI, and suggests weather-appropriate outfits by analyzing current conditions through OpenWeather API integration.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 19 with Vite for fast development and building
- **Styling**: Tailwind CSS for utility-first styling with custom components
- **UI Components**: Headless UI for accessible interface elements
- **HTTP Client**: Axios for API communication with the Flask backend
- **State Management**: React hooks for local component state
- **Build System**: Vite with hot module replacement for development

## Backend Architecture
- **Framework**: Flask with SQLAlchemy ORM for database operations
- **Database**: SQLite for local development with simple schema design
- **File Storage**: Local filesystem with secure filename handling
- **AI Integration**: Google Gemini 2.5 Flash model for fashion analysis
- **Weather Service**: OpenWeather API for real-time weather data
- **CORS**: Enabled for cross-origin requests from frontend

## Data Model
- **WardrobeItem**: Stores clothing items with auto-generated descriptions
  - Primary key with auto-increment
  - Secure filename storage pattern
  - AI-generated descriptions
  - Unix timestamp for creation tracking

## API Design
- **RESTful endpoints** for wardrobe management (CRUD operations)
- **File upload handling** with security validation
- **Multi-modal input** supporting both uploaded files and existing wardrobe items
- **Location-based services** with city name or GPS coordinates

## Security Considerations
- **File type validation** limited to safe image formats
- **Secure filename handling** with werkzeug utilities
- **Environment variable management** for API keys
- **Input sanitization** for user-provided data

# External Dependencies

## AI Services
- **Google Gemini API**: Computer vision and natural language processing for clothing analysis and outfit suggestions
- **Custom JSON parsing**: Robust extraction from AI responses with fallback mechanisms

## Weather Services
- **OpenWeather API**: Real-time weather data and forecasting
- **Season inference**: Hemisphere-aware seasonal calculations for outfit appropriateness

## Development Tools
- **Vite**: Modern build tool with fast development server
- **ESLint**: Code quality and consistency enforcement
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development

## Python Libraries
- **Flask ecosystem**: Web framework with SQLAlchemy ORM and CORS support
- **PIL (Pillow)**: Image processing and manipulation
- **Requests**: HTTP client for external API communication
- **Werkzeug**: Security utilities for file handling

## JavaScript Libraries
- **React ecosystem**: UI framework with modern hooks and components
- **Axios**: Promise-based HTTP client for API requests
- **Lucide React**: Icon library for consistent UI elements
- **Headless UI**: Accessible component primitives