'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface ImageUploadProps {
  onImageUploaded: (imageData: string) => void; // Now expects base64 data
  currentImageData?: string; // Changed from currentImageUrl to currentImageData
}

export default function ImageUpload({
  onImageUploaded,
  currentImageData,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentImageData || null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear preview when currentImageData is cleared
  useEffect(() => {
    if (!currentImageData) {
      setPreviewUrl(null);
      setUploadError(null);
    }
  }, [currentImageData]);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target?.result as string;
        setPreviewUrl(base64Data);
        onImageUploaded(base64Data);
        setIsUploading(false);
      };
      reader.onerror = () => {
        setUploadError('Failed to read file');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File processing error:', error);
      setUploadError(
        error instanceof Error ? error.message : 'File processing failed',
      );
      setIsUploading(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const fakeEvent = {
        target: { files: [file] },
      } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(fakeEvent);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="space-y-4">
      <Label htmlFor="image-upload">Upload Image</Label>

      <Card
        className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="p-6 text-center">
          {previewUrl ? (
            <div className="space-y-4">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-48 mx-auto rounded-lg object-cover"
              />
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Click to change image</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewUrl(null);
                    onImageUploaded('');
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-800 underline"
                >
                  Remove image
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-4xl text-gray-400">📷</div>
              <div>
                <p className="text-lg font-medium">
                  Drop an image here or click to select
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG, WebP up to 10MB
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Input
        ref={fileInputRef}
        id="image-upload"
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {isUploading && (
        <div className="text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Processing image...</span>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
          {uploadError}
        </div>
      )}

      {previewUrl && (
        <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md">
          ✅ Image ready for submission
        </div>
      )}
    </div>
  );
}
