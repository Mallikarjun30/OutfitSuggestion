import { useEffect, useState } from "react";
import { Trash2, ShirtIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface WardrobeItem {
  id: string;
  name: string;
  image_url?: string; // kept for compatibility, but we'll fetch using id
  fallback_text?: string;
}

interface WardrobeGalleryProps {
  items: WardrobeItem[];
  onDeleteItem: (id: string) => void;
}

const WardrobeGallery = ({ items, onDeleteItem }: WardrobeGalleryProps) => {
  const { token } = useAuth();
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadImages() {
      const newUrls: Record<string, string> = {};
      const newLoading: Record<string, boolean> = {};

      for (const item of items) {
        newLoading[item.id] = true;
        try {
          if (token) {
            const res = await fetch(`/wardrobe/${item.id}/file`, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              signal: controller.signal,
            });

            if (res.ok) {
              const blob = await res.blob();
              const objectUrl = URL.createObjectURL(blob);
              newUrls[item.id] = objectUrl;
            } else {
              console.warn(`Failed to fetch image for item ${item.id}`, res.status);
            }
          }
        } catch (err) {
          if ((err as any).name !== "AbortError") {
            console.error("Error loading wardrobe image:", err);
          }
        } finally {
          newLoading[item.id] = false;
        }
      }

      if (active) {
        setImageUrls((prev) => ({ ...prev, ...newUrls }));
        setLoading((prev) => ({ ...prev, ...newLoading }));
      }
    }

    loadImages();

    return () => {
      active = false;
      controller.abort();
      // cleanup object URLs
      Object.values(imageUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [items, token]);

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
        {items.map((item) => {
          const isLoading = loading[item.id];
          const imageSrc = imageUrls[item.id];

          return (
            <div key={item.id} className="wardrobe-item group">
              <div className="relative aspect-square">
                {isLoading ? (
                  <div className="w-full h-full bg-gray-100 animate-pulse rounded-xl" />
                ) : imageSrc ? (
                  <img
                    src={imageSrc}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-pastel flex items-center justify-center rounded-xl">
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
          );
        })}
      </div>
    </div>
  );
};

export default WardrobeGallery;
