import { useEffect, useState } from "react";
import { Sparkles, Sun, Cloud, CloudRain, Snowflake, ShirtIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext"; // 🔑 make sure you have a context providing token

interface Recommendation {
  id?: string;
  suggestion_text: string;
  reason: string;
  image_url?: string;
  fallback_text?: string;
}

interface RecommendationsDisplayProps {
  recommendations: Recommendation[];
  weather?: {
    season: string;
    condition: string;
  };
}

const WeatherIcon = ({ condition }: { condition: string }) => {
  const iconClass = "w-5 h-5";

  switch (condition.toLowerCase()) {
    case "sunny":
    case "clear":
      return <Sun className={`${iconClass} text-yellow-500`} />;
    case "rainy":
    case "rain":
      return <CloudRain className={`${iconClass} text-blue-500`} />;
    case "snowy":
    case "snow":
      return <Snowflake className={`${iconClass} text-blue-300`} />;
    case "cloudy":
    case "overcast":
      return <Cloud className={`${iconClass} text-gray-500`} />;
    default:
      return <Sun className={`${iconClass} text-yellow-500`} />;
  }
};

const RecommendationsDisplay = ({ recommendations, weather }: RecommendationsDisplayProps) => {
  const { token } = useAuth();
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    let objectUrls: string[] = [];

    async function fetchImages() {
      if (!token) return;

      const urls: Record<string, string> = {};

      for (const rec of recommendations) {
        if (rec.image_url) {
          try {
            const res = await fetch(rec.image_url, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch image");
            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);
            objectUrls.push(objectUrl);
            urls[rec.id || rec.image_url] = objectUrl;
          } catch (err) {
            console.error("Error loading recommendation image:", err);
          }
        }
      }

      if (mounted) setImageUrls(urls);
    }

    fetchImages();

    return () => {
      mounted = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [recommendations, token]);

  if (recommendations.length === 0) {
    return (
      <div className="fashion-card">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Recommendations
        </h2>
        <div className="text-center py-12">
          <div className="p-4 bg-pastel-lavender rounded-full w-fit mx-auto mb-4">
            <Sparkles className="w-12 h-12 text-primary/60" />
          </div>
          <p className="text-lg font-medium text-foreground mb-2">
            AI has no advice right now 🤖
          </p>
          <p className="text-muted-foreground">
            Try uploading an outfit or adding wardrobe items to get personalized suggestions!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fashion-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          AI Style Recommendations
        </h2>

        {weather && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-accent rounded-full">
            <WeatherIcon condition={weather.condition} />
            <span className="text-sm font-medium capitalize">
              {weather.season} • {weather.condition}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {recommendations.map((rec, index) => {
          const key = rec.id || rec.image_url || `rec-${index}`;
          const secureUrl = imageUrls[key];

          return (
            <div
              key={key}
              className="recommendation-card"
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              <div className="flex gap-4">
                {/* Image */}
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-xl overflow-hidden">
                    {secureUrl ? (
                      <img
                        src={secureUrl}
                        alt={rec.suggestion_text}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-pastel flex items-center justify-center">
                        <ShirtIcon className="w-8 h-8 text-primary/60" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-2">
                    {rec.suggestion_text}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {rec.reason}
                  </p>
                  {rec.fallback_text && !secureUrl && (
                    <p className="text-xs text-primary mt-2 font-medium">
                      💡 {rec.fallback_text}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-border">
        <p className="text-center text-sm text-muted-foreground">
          ✨ Powered by AI Fashion Intelligence
        </p>
      </div>
    </div>
  );
};

export default RecommendationsDisplay;
