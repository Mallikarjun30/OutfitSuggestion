import { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import WardrobeGallery from './components/WardrobeGallery';
import OutfitSuggestions from './components/OutfitSuggestions';
import LocationDetector from './components/LocationDetector';
import ApiService from './services/apiService';
import './App.css';

function App() {
  const [wardrobeItems, setWardrobeItems] = useState([]);
  const [suggestions, setSuggestions] = useState(null);
  const [location, setLocation] = useState(null);
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState({
    wardrobe: false,
    upload: false,
    suggestions: false,
  });
  const [activeTab, setActiveTab] = useState('wardrobe');

  useEffect(() => {
    loadWardrobe();
  }, []);

  const loadWardrobe = async () => {
    try {
      setLoading(prev => ({ ...prev, wardrobe: true }));
      const items = await ApiService.getWardrobe();
      setWardrobeItems(items);
    } catch (error) {
      console.error('Failed to load wardrobe:', error);
      showToast('Failed to load wardrobe items', 'error');
    } finally {
      setLoading(prev => ({ ...prev, wardrobe: false }));
    }
  };

  const handleWardrobeUpload = async (files) => {
    if (!files.length) return;
    
    try {
      setLoading(prev => ({ ...prev, upload: true }));
      const response = await ApiService.uploadWardrobeItems(files);
      await loadWardrobe(); // Refresh the wardrobe
      showToast(`Successfully uploaded ${response.uploaded.length} items!`, 'success');
    } catch (error) {
      console.error('Upload failed:', error);
      showToast('Failed to upload items. Please try again.', 'error');
    } finally {
      setLoading(prev => ({ ...prev, upload: false }));
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await ApiService.deleteWardrobeItem(itemId);
      await loadWardrobe(); // Refresh the wardrobe
      showToast('Item deleted successfully', 'success');
    } catch (error) {
      console.error('Delete failed:', error);
      showToast('Failed to delete item', 'error');
    }
  };

  const handleOutfitAnalysis = async (files) => {
    if (!files.length) return;
    
    try {
      setLoading(prev => ({ ...prev, suggestions: true }));
      const result = await ApiService.getOutfitSuggestions(
        files, 
        city, 
        location?.lat, 
        location?.lon
      );
      setSuggestions(result);
      setActiveTab('suggestions');
      showToast('Analysis complete! Check your suggestions.', 'success');
    } catch (error) {
      console.error('Analysis failed:', error);
      showToast('Failed to analyze outfit. Please try again.', 'error');
    } finally {
      setLoading(prev => ({ ...prev, suggestions: false }));
    }
  };

  const handleLocationDetected = (detectedLocation) => {
    setLocation(detectedLocation);
    showToast('Location detected successfully!', 'success');
  };

  const showToast = (message, type = 'info') => {
    // Simple toast implementation - you could use a toast library here
    console.log(`${type.toUpperCase()}: ${message}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                AI Wardrobe Stylist
              </h1>
              <p className="text-gray-600 mt-1">
                Get personalized styling suggestions powered by AI
              </p>
            </div>
            <LocationDetector onLocationDetected={handleLocationDetected} />
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'wardrobe', name: 'My Wardrobe', icon: '👕' },
              { id: 'upload', name: 'Add Items', icon: '📤' },
              { id: 'analyze', name: 'Style Me', icon: '✨' },
              { id: 'suggestions', name: 'Suggestions', icon: '💡' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'wardrobe' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-900">My Wardrobe</h2>
              <div className="text-sm text-gray-500">
                {wardrobeItems.length} items
              </div>
            </div>
            <WardrobeGallery
              items={wardrobeItems}
              onDeleteItem={handleDeleteItem}
              loading={loading.wardrobe}
            />
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Add Wardrobe Items</h2>
              <p className="text-gray-600">
                Upload photos of your clothing items. Our AI will analyze and categorize them for you.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <FileUpload
                onFilesSelected={handleWardrobeUpload}
                accept="image/*"
                multiple={true}
              />
              {loading.upload && (
                <div className="mt-4 flex items-center justify-center space-x-2 text-blue-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span>Analyzing and uploading your items...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analyze' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Get Style Suggestions</h2>
              <p className="text-gray-600">
                Upload photos of what you're wearing and get AI-powered styling recommendations.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City (optional)
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter city name for weather-based suggestions"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-end">
                  <div className="text-sm text-gray-600">
                    {location ? (
                      <span className="text-green-600">📍 Using detected location</span>
                    ) : (
                      <span>Use location detection or enter a city above</span>
                    )}
                  </div>
                </div>
              </div>
              
              <FileUpload
                onFilesSelected={handleOutfitAnalysis}
                accept="image/*"
                multiple={true}
              />
              
              {loading.suggestions && (
                <div className="mt-4 flex items-center justify-center space-x-2 text-green-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                  <span>Analyzing your outfit and generating suggestions...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Style Suggestions</h2>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <OutfitSuggestions
                suggestions={suggestions}
                loading={loading.suggestions}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
