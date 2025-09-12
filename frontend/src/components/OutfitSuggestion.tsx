import { useState } from 'react';
import { MapPin, Sparkles, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OutfitSuggestionProps {
  onGetSuggestions: (files: File[], city?: string) => void;
  isLoading: boolean;
}

const OutfitSuggestion = ({ onGetSuggestions, isLoading }: OutfitSuggestionProps) => {
  const [city, setCity] = useState('');
  const [outfitFiles, setOutfitFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    );
    
    setOutfitFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setOutfitFiles(files);
  };

  const handleGetSuggestions = () => {
    onGetSuggestions(outfitFiles, city || undefined);
  };

  const removeFile = (index: number) => {
    setOutfitFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fashion-card">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary animate-pulse" />
        Get AI Outfit Suggestions
      </h2>
      
      <div className="space-y-6">
        {/* City Input */}
        <div>
          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            City (Optional)
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="🌆 Enter your city for weather-based suggestions..."
            className="fashion-input w-full"
          />
        </div>
        
        {/* Outfit Upload */}
        <div>
          <label className="block text-sm font-medium mb-2 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" />
            Upload Current Outfit (Optional)
          </label>
          
          <div
            className={cn(
              "dropzone cursor-pointer",
              isDragOver && "border-primary bg-accent/70"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('outfit-input')?.click()}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-pastel-peach rounded-full">
                <Upload className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">
                  Upload current outfit
                </p>
                <p className="text-sm text-muted-foreground">
                  Help AI understand your style preferences
                </p>
              </div>
            </div>
          </div>
          
          <input
            id="outfit-input"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
          
          {outfitFiles.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {outfitFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="bg-card-soft rounded-lg p-3 border border-border">
                    <div className="aspect-video bg-pastel-sky rounded flex items-center justify-center mb-2">
                      <ImageIcon className="w-5 h-5 text-primary/60" />
                    </div>
                    <p className="text-xs font-medium truncate">{file.name}</p>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute -top-1 -right-1 p-1 bg-destructive text-destructive-foreground rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* CTA Button */}
        <button
          onClick={handleGetSuggestions}
          disabled={isLoading}
          className="fashion-button-success w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Getting AI suggestions...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Get Style Suggestions ✨
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default OutfitSuggestion;