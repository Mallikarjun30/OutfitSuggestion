import { Trash2, ShirtIcon } from 'lucide-react';

interface WardrobeItem {
  id: string;
  name: string;
  image_url?: string;
  fallback_text?: string;
}

interface WardrobeGalleryProps {
  items: WardrobeItem[];
  onDeleteItem: (id: string) => void;
}

const WardrobeGallery = ({ items, onDeleteItem }: WardrobeGalleryProps) => {
  if (items.length === 0) {
    return (
      <div className="fashion-card">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <ShirtIcon className="w-5 h-5 text-primary" />
          Your Wardrobe
        </h2>
        <div className="text-center py-12">
          <div className="p-4 bg-pastel-mint rounded-full w-fit mx-auto mb-4">
            <ShirtIcon className="w-12 h-12 text-success" />
          </div>
          <p className="text-lg font-medium text-foreground mb-2">
            Your wardrobe is empty 👕
          </p>
          <p className="text-muted-foreground">
            Start by adding some items above!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fashion-card">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <ShirtIcon className="w-5 h-5 text-primary" />
        Your Wardrobe ({items.length} items)
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.id} className="wardrobe-item group">
            <div className="relative aspect-square">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-pastel flex items-center justify-center">
                  <div className="text-center p-4">
                    <ShirtIcon className="w-8 h-8 text-primary/60 mx-auto mb-2" />
                    <p className="text-xs font-medium text-foreground">
                      {item.fallback_text || item.name}
                    </p>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => onDeleteItem(item.id)}
                className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            
            <div className="p-3">
              <p className="font-medium text-sm truncate">{item.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WardrobeGallery;