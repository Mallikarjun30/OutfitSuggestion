import { useState } from 'react';
import OutfitSuggestion from '@/components/OutfitSuggestion';
import RecommendationsDisplay from '@/components/RecommendationsDisplay';
import { Sparkles, Zap, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Recommendation {
  id: string;
  suggestion_text: string;
  reason: string;
  image_url?: string;
  fallback_text?: string;
}

const Suggestions = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const { toast } = useToast();

  // Mock weather data
  const mockWeather = {
    season: 'Spring',
    condition: 'Sunny'
  };

  const handleGetSuggestions = async (files: File[], city?: string) => {
    setIsLoadingSuggestions(true);
    
    // Mock AI suggestions - in real app would call API
    setTimeout(() => {
      const mockSuggestions: Recommendation[] = [
        {
          id: 'rec-1',
          suggestion_text: 'Light Blue Denim Jacket',
          reason: 'Perfect for spring weather! The light wash complements the sunny conditions and adds a casual-chic vibe to any outfit.',
          fallback_text: 'Great layering piece for transitional weather'
        },
        {
          id: 'rec-2',
          suggestion_text: 'White Cotton T-Shirt',
          reason: 'A classic foundation piece that works with everything. The breathable cotton is ideal for warm spring days.',
          fallback_text: 'Versatile essential for any wardrobe'
        },
        {
          id: 'rec-3',
          suggestion_text: 'Comfortable Sneakers',
          reason: 'Perfect for walking around the city on a sunny day. White or light colors will keep you cool and stylish.',
          fallback_text: 'Comfortable and weather-appropriate footwear'
        },
        {
          id: 'rec-4',
          suggestion_text: 'High-Waisted Jeans',
          reason: 'Flattering silhouette that pairs beautifully with crop tops and fitted shirts. The high waist creates a sleek line.',
          fallback_text: 'Versatile and flattering bottom choice'
        },
        {
          id: 'rec-5',
          suggestion_text: 'Statement Sunglasses',
          reason: 'Essential for sunny spring days and adds an instant style upgrade to any casual outfit.',
          fallback_text: 'Stylish sun protection accessory'
        }
      ];
      
      setRecommendations(mockSuggestions);
      setIsLoadingSuggestions(false);
      
      toast({
        title: "AI suggestions ready! ✨",
        description: `Got ${mockSuggestions.length} personalized recommendations${city ? ` for ${city}` : ''}`,
      });
    }, 2000);
  };

  const handleRefreshSuggestions = () => {
    if (recommendations.length > 0) {
      setRecommendations([]);
      toast({
        title: "Suggestions cleared",
        description: "Ready for new AI recommendations",
      });
    }
  };

  const generateQuickSuggestions = () => {
    setIsLoadingSuggestions(true);
    
    setTimeout(() => {
      const quickSuggestions: Recommendation[] = [
        {
          id: 'quick-1',
          suggestion_text: 'Business Casual Look',
          reason: 'Perfect for work meetings or professional events. Combines comfort with sophistication.',
          fallback_text: 'Professional and polished outfit choice'
        },
        {
          id: 'quick-2',
          suggestion_text: 'Weekend Casual',
          reason: 'Relaxed and comfortable for weekend activities while still looking put-together.',
          fallback_text: 'Comfortable weekend style'
        },
        {
          id: 'quick-3',
          suggestion_text: 'Date Night Elegant',
          reason: 'Sophisticated and romantic outfit perfect for dinner dates or special occasions.',
          fallback_text: 'Elegant evening look'
        }
      ];
      
      setRecommendations(quickSuggestions);
      setIsLoadingSuggestions(false);
      
      toast({
        title: "Quick suggestions ready! ⚡",
        description: `Generated ${quickSuggestions.length} style ideas instantly`,
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-success rounded-2xl animate-pulse">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-success bg-clip-text text-transparent">
                AI Style Suggestions
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Get personalized outfit recommendations powered by AI. Upload a photo of your current look 
              or let our AI suggest styles based on weather and trends.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={generateQuickSuggestions}
              disabled={isLoadingSuggestions}
              className="fashion-button-success inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Zap className="w-5 h-5" />
              {isLoadingSuggestions ? 'Generating...' : 'Quick Suggestions'}
            </button>
            
            <button
              onClick={handleRefreshSuggestions}
              className="fashion-button-primary inline-flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Clear Suggestions
            </button>
          </div>

          {/* Weather Info Card */}
          <div className="fashion-card bg-gradient-soft max-w-md mx-auto text-center">
            <h3 className="font-semibold mb-2">Current Conditions</h3>
            <p className="text-muted-foreground">
              {mockWeather.season} • {mockWeather.condition}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Recommendations will be tailored to current weather
            </p>
          </div>

          {/* Outfit Suggestion Input */}
          <OutfitSuggestion
            onGetSuggestions={handleGetSuggestions}
            isLoading={isLoadingSuggestions}
          />

          {/* Recommendations Display */}
          <RecommendationsDisplay
            recommendations={recommendations}
            weather={mockWeather}
          />

          {/* Empty State */}
          {recommendations.length === 0 && !isLoadingSuggestions && (
            <div className="text-center py-16">
              <div className="fashion-card max-w-md mx-auto">
                <div className="p-6 bg-gradient-hero rounded-2xl mb-4 mx-auto w-24 h-24 flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">Ready for style magic?</h3>
                <p className="text-muted-foreground mb-6">
                  Upload a photo of your current look or get instant AI-powered style suggestions 
                  tailored to today's weather and latest trends.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={generateQuickSuggestions}
                    className="w-full fashion-button-success inline-flex items-center justify-center gap-2"
                  >
                    <Zap className="w-5 h-5" />
                    Get Instant Suggestions
                  </button>
                  <p className="text-sm text-muted-foreground">
                    or scroll up to upload a photo for personalized recommendations
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoadingSuggestions && (
            <div className="text-center py-16">
              <div className="fashion-card max-w-md mx-auto">
                <div className="animate-pulse space-y-4">
                  <div className="p-6 bg-gradient-fashion rounded-2xl mb-4 mx-auto w-24 h-24 flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-white animate-bounce" />
                  </div>
                  <h3 className="text-2xl font-semibold">AI is working its magic...</h3>
                  <p className="text-muted-foreground">
                    Analyzing styles, weather, and trends to create perfect recommendations for you.
                  </p>
                  <div className="flex justify-center space-x-1 pt-4">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Suggestions;