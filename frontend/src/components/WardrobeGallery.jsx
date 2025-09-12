import { useState } from 'react';

const WardrobeGallery = ({ items, onDeleteItem, loading = false }) => {
  const [selectedItem, setSelectedItem] = useState(null);

  const handleDelete = (item) => {
    if (window.confirm(`Are you sure you want to delete this item?`)) {
      onDeleteItem(item.id);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">👕</div>
        <p>No wardrobe items yet. Upload some photos to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-square overflow-hidden">
              <img
                src={item.file_url}
                alt="Wardrobe item"
                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setSelectedItem(item)}
              />
            </div>
            <div className="p-3">
              <p className="text-sm text-gray-600 line-clamp-3 mb-2">
                {item.description || 'No description available'}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">
                  {new Date(item.created_at * 1000).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleDelete(item)}
                  className="text-red-500 hover:text-red-700 text-sm p-1 hover:bg-red-50 rounded"
                  title="Delete item"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal for detailed view */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedItem(null)}>
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Wardrobe Item Details</h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <img
                src={selectedItem.file_url}
                alt="Wardrobe item detail"
                className="w-full rounded-lg mb-4"
              />
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-700">Description:</span>
                  <p className="text-gray-600 mt-1">{selectedItem.description || 'No description available'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Added:</span>
                  <p className="text-gray-600">{new Date(selectedItem.created_at * 1000).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WardrobeGallery;