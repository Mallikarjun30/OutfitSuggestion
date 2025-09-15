import { useState } from 'react';
import OutfitSuggestion from '@/components/OutfitSuggestion';
import RecommendationsDisplay from '@/components/RecommendationsDisplay';
import { Sparkles, Zap, RefreshCw, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

interface Recommendation {
  id?: string;
  suggestion_text: string;
  reason: string;
  image_url?: string;
  fallback_text?: string;
}

interface Weather {
  season: string;
  condition: string;
}

const Suggestions = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [gender, setGender] = useState('');
  const [skinTone, setSkinTone] = useState('');
  const { toast } = useToast();

  const isProfileComplete = gender && skinTone;

  const handleGetSuggestions = async (files: File[], city?: string) => {
    if (!isProfileComplete) {
      toast({
        title: "Profile required",
        description: "Please fill in your gender and skin tone above for personalized suggestions.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingSuggestions(true);
    
    try {
      const result = await apiClient.suggestOutfits({
        files: files.length > 0 ? files : undefined,
        city: city || undefined,
        hemisphere: 'north', // Default hemisphere
        units: 'metric',
        profile: { gender, skinTone }
      });
      
      setRecommendations(result.recommendations);
      if (result.weather) {
        setWeather(result.weather);
      }
      
      toast({
        title: "AI suggestions ready! ✨",
        description: `Got ${result.recommendations.length} personalized recommendations${city ? ` for ${city}` : ''}`,
      });
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      toast({
        title: "Failed to get suggestions",
        description: "There was an error getting AI recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
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

  const generateQuickSuggestions = async () => {
    if (!isProfileComplete) {
      toast({
        title: "Profile required",
        description: "Please fill in your gender and skin tone above for personalized suggestions.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoadingSuggestions(true);
    
    try {
      // Get suggestions without specific files, just based on weather
      const result = await apiClient.suggestOutfits({
        hemisphere: 'north',
        units: 'metric',
        profile: { gender, skinTone }
      });
      
      setRecommendations(result.recommendations);
      if (result.weather) {
        setWeather(result.weather);
      }
      
      toast({
        title: "Quick suggestions ready! ⚡",
        description: `Generated ${result.recommendations.length} style ideas instantly`,
      });
    } catch (error) {
      console.error('Failed to get quick suggestions:', error);
      toast({
        title: "Failed to get suggestions",
        description: "There was an error getting quick recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Profile Section */}
          <div className="fashion-card">
            <div className="space-y-4 p-4 bg-gradient-soft rounded-lg border border-border">
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Profile Information (Required)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="fashion-input w-full text-sm"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Skin Tone</label>
                  <select
                    value={skinTone}
                    onChange={(e) => setSkinTone(e.target.value)}
                    className="fashion-input w-full text-sm"
                    required
                  >
                    <option value="">Select Skin Tone</option>
                    <option value="Very Light">Very Light</option>
                    <option value="Light">Light</option>
                    <option value="Medium Light">Medium Light</option>
                    <option value="Medium">Medium</option>
                    <option value="Medium Deep">Medium Deep</option>
                    <option value="Deep">Deep</option>
                    <option value="Very Deep">Very Deep</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                ✨ This information helps our AI provide more personalized outfit suggestions for you
              </p>
            </div>
          </div>

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
              disabled={isLoadingSuggestions || !isProfileComplete}
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
          {weather && (
            <div className="fashion-card bg-gradient-soft max-w-md mx-auto text-center">
              <h3 className="font-semibold mb-2">Current Conditions</h3>
              <p className="text-muted-foreground">
                {weather.season} • {weather.condition}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Recommendations are tailored to current weather
              </p>
            </div>
          )}

          {/* Outfit Suggestion Input */}
          <OutfitSuggestion
            onGetSuggestions={handleGetSuggestions}
            isLoading={isLoadingSuggestions}
          />

          {/* Recommendations Display */}
          <RecommendationsDisplay
            recommendations={recommendations}
            weather={weather}
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
                    disabled={!isProfileComplete}
                    className="w-full fashion-button-success inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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