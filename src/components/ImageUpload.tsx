import { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  preview?: string;
  onClear?: () => void;
}

const ImageUpload = ({ onImageSelect, preview, onClear }: ImageUploadProps) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-4">
      {preview ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative rounded-lg overflow-hidden shadow-md"
        >
          <img src={preview} alt="Preview" className="w-full h-64 object-cover" />
          {onClear && (
            <Button
              onClick={onClear}
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
        >
          <div className="space-y-4">
            <div className="flex justify-center gap-4">
              <Camera className="h-12 w-12 text-muted-foreground" />
              <Upload className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Drag and drop an image or click to upload
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {t('soil.uploadImage')}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ImageUpload;
