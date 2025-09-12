import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WardrobeUploadProps {
  onFilesAdded: (files: File[]) => void;
  uploadedFiles: File[];
  onFileRemoved: (index: number) => void;
}

const WardrobeUpload = ({ onFilesAdded, uploadedFiles, onFileRemoved }: WardrobeUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      onFilesAdded(files);
    }
  }, [onFilesAdded]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesAdded(files);
    }
  }, [onFilesAdded]);

  return (
    <div className="fashion-card">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <ImageIcon className="w-5 h-5 text-primary" />
        Upload Wardrobe Items
      </h2>
      
      <div
        className={cn(
          "dropzone cursor-pointer",
          isDragOver && "border-primary bg-accent/70"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('wardrobe-input')?.click()}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-pastel-sky rounded-full">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">
              Drag & drop wardrobe items here
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse your files
            </p>
          </div>
        </div>
      </div>
      
      <input
        id="wardrobe-input"
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />
      
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium mb-3 text-sm text-muted-foreground">
            UPLOADED FILES ({uploadedFiles.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <div className="bg-card-soft rounded-xl p-3 border border-border">
                  <div className="aspect-square bg-pastel-lavender rounded-lg flex items-center justify-center mb-2">
                    <ImageIcon className="w-6 h-6 text-primary/60" />
                  </div>
                  <p className="text-xs font-medium truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(1)}MB
                  </p>
                </div>
                <button
                  onClick={() => onFileRemoved(index)}
                  className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WardrobeUpload;