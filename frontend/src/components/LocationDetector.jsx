import { useState } from 'react';

const LocationDetector = ({ onLocationDetected }) => {
  const [detecting, setDetecting] = useState(false);
  const [location, setLocation] = useState(null);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        setLocation(loc);
        setDetecting(false);
        onLocationDetected(loc);
      },
      (error) => {
        setDetecting(false);
        console.error('Error detecting location:', error);
        alert('Unable to detect your location. Please enter a city name instead.');
      }
    );
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={detectLocation}
        disabled={detecting}
        className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
      >
        {detecting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Detecting...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Detect Location</span>
          </>
        )}
      </button>
      {location && (
        <span className="text-sm text-green-600 font-medium">
          📍 Location detected
        </span>
      )}
    </div>
  );
};

export default LocationDetector;