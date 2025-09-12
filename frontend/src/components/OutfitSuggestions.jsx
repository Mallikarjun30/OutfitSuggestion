const OutfitSuggestions = ({ suggestions, loading = false }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!suggestions) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">✨</div>
        <p>Upload your outfit photos to get AI-powered styling suggestions!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weather and Context Info */}
      {suggestions.weather && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Season:</span>
              <span className="capitalize">{suggestions.season}</span>
            </div>
            {suggestions.weather.weather && (
              <div className="flex items-center space-x-2">
                <span className="font-medium">Weather:</span>
                <span className="capitalize">
                  {suggestions.weather.weather[0].description}
                </span>
                {suggestions.weather.main && (
                  <span>({Math.round(suggestions.weather.main.temp)}°C)</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Notes */}
      {suggestions.notes && (
        <div className="bg-purple-50 rounded-lg p-4">
          <h4 className="font-medium text-purple-800 mb-2">AI Stylist Notes</h4>
          <p className="text-purple-700 text-sm">{suggestions.notes}</p>
        </div>
      )}

      {/* Outfit Analysis */}
      {suggestions.outfit_descriptions && suggestions.outfit_descriptions.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-800">Your Outfit Analysis</h4>
          {suggestions.outfit_descriptions.map((outfit, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-700 mb-1">
                Image {outfit.image_index}
              </div>
              <p className="text-sm text-gray-600">{outfit.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {suggestions.suggestions && suggestions.suggestions.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-800">Recommendations</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestions.suggestions.map((suggestion, index) => (
              <div key={index} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                {suggestion.item ? (
                  <div className="flex space-x-4">
                    <div className="flex-shrink-0">
                      <img
                        src={suggestion.item.file_url}
                        alt="Recommended item"
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 mb-1">
                        From your wardrobe:
                      </p>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                        {suggestion.item.description}
                      </p>
                      <p className="text-sm text-gray-800">
                        <span className="font-medium">Why:</span> {suggestion.reason}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="text-sm text-gray-800 font-medium">
                          Suggested Addition:
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          {suggestion.fallback_text}
                        </p>
                        <p className="text-sm text-gray-800">
                          <span className="font-medium">Why:</span> {suggestion.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OutfitSuggestions;