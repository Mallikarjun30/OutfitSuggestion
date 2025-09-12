import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import WardrobeUpload from '@/components/WardrobeUpload';
import WardrobeGallery from '@/components/WardrobeGallery';
import { useToast } from '@/hooks/use-toast';
import { Upload, Shirt, Plus } from 'lucide-react';
import { apiClient, type FrontendWardrobeItem } from '@/lib/api';

const Wardrobe = () => {
  const [wardrobeItems, setWardrobeItems] = useState<FrontendWardrobeItem[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Load wardrobe items from backend
  const loadWardrobeItems = async () => {
    try {
      setLoading(true);
      const items = await apiClient.listWardrobe();
      setWardrobeItems(items);
    } catch (error) {
      console.error('Failed to load wardrobe items:', error);
      toast({
        title: "Error loading wardrobe",
        description: "Failed to load your wardrobe items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load items on component mount
  useEffect(() => {
    loadWardrobeItems();
  }, []);

  // Auto-open upload if coming from link
  useEffect(() => {
    if (searchParams.get('upload') === 'true') {
      setShowUpload(true);
    }
  }, [searchParams]);

  const handleFilesAdded = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
    toast({
      title: "Files added! 📸",
      description: `Added ${files.length} items to upload queue`,
    });
  };

  const handleFileRemoved = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "File removed",
      description: "File removed from upload queue",
    });
  };

  const handleUploadWardrobe = async () => {
    if (uploadedFiles.length === 0) return;

    try {
      setUploading(true);
      const newItems = await apiClient.uploadWardrobe(uploadedFiles);
      
      // Refresh the wardrobe list to get the latest items
      await loadWardrobeItems();
      
      setUploadedFiles([]);
      setShowUpload(false);
      
      toast({
        title: "Upload successful! 🎉",
        description: `Added ${newItems.length} items to your wardrobe`,
      });
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      // Optimistic update
      const originalItems = wardrobeItems;
      setWardrobeItems(prev => prev.filter(item => item.id !== id));
      
      const success = await apiClient.deleteWardrobe(id);
      
      if (success) {
        toast({
          title: "Item removed",
          description: "Wardrobe item deleted successfully",
        });
      } else {
        // Rollback on failure
        setWardrobeItems(originalItems);
        toast({
          title: "Delete failed",
          description: "Failed to delete item. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Delete failed:', error);
      // Reload items to ensure consistency
      await loadWardrobeItems();
      toast({
        title: "Delete failed",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-fashion rounded-2xl">
                <Shirt className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-fashion bg-clip-text text-transparent">
                My Wardrobe
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Organize and manage your clothing collection. Upload new items or browse your existing wardrobe.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="fashion-button-primary inline-flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              {showUpload ? 'Hide Upload' : 'Upload Items'}
            </button>
            
            {wardrobeItems.length > 0 && (
              <button
                onClick={() => toast({
                  title: "Coming Soon! 🔄",
                  description: "Bulk organization features will be available soon",
                })}
                className="fashion-button-success inline-flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Organize Items
              </button>
            )}
          </div>

          {/* Upload Section */}
          {showUpload && (
            <div className="animate-fade-in">
              <WardrobeUpload
                onFilesAdded={handleFilesAdded}
                uploadedFiles={uploadedFiles}
                onFileRemoved={handleFileRemoved}
              />
              
              {uploadedFiles.length > 0 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleUploadWardrobe}
                    disabled={uploading}
                    className="fashion-button-success inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? '⏳ Uploading...' : `📁 Upload to Wardrobe (${uploadedFiles.length} files)`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Wardrobe Gallery */}
          <WardrobeGallery
            items={wardrobeItems}
            onDeleteItem={handleDeleteItem}
          />

          {/* Empty State */}
          {wardrobeItems.length === 0 && !showUpload && (
            <div className="text-center py-16">
              <div className="fashion-card max-w-md mx-auto">
                <div className="p-6 bg-gradient-pastel rounded-2xl mb-4 mx-auto w-24 h-24 flex items-center justify-center">
                  <Shirt className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">Your wardrobe is empty</h3>
                <p className="text-muted-foreground mb-6">
                  Start by uploading some of your favorite clothing items to get personalized style suggestions.
                </p>
                <button
                  onClick={() => setShowUpload(true)}
                  className="fashion-button-primary inline-flex items-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Upload First Items
                </button>
              </div>
            </div>
          )}

          {/* Stats */}
          {wardrobeItems.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="fashion-card text-center">
                <div className="text-3xl font-bold text-primary mb-1">{wardrobeItems.length}</div>
                <div className="text-sm text-muted-foreground">Total Items</div>
              </div>
              <div className="fashion-card text-center">
                <div className="text-3xl font-bold text-accent-emerald mb-1">0</div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
              <div className="fashion-card text-center">
                <div className="text-3xl font-bold text-accent-rose mb-1">0</div>
                <div className="text-sm text-muted-foreground">Outfits Created</div>
              </div>
              <div className="fashion-card text-center">
                <div className="text-3xl font-bold text-accent-amber mb-1">0</div>
                <div className="text-sm text-muted-foreground">AI Suggestions</div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Wardrobe;