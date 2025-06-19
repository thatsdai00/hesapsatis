'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { FaUpload, FaSpinner, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';

interface ImageUploaderProps {
  currentImage?: string | null;
  type?: 'products' | 'logos' | 'sliders' | 'categories';
  uploadPath?: string;
  onImageUploaded: (imageUrl: string) => void;
  className?: string;
}

export default function ImageUploader({ 
  currentImage, 
  type, 
  uploadPath,
  onImageUploaded, 
  className = '' 
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle currentImage initialization and changes
  useEffect(() => {
    if (currentImage) {
      // If it's a relative path, convert to absolute for preview
      if (currentImage.startsWith('/')) {
        setPreviewUrl(`${window.location.origin}${currentImage}`);
      } else {
        setPreviewUrl(currentImage);
      }
    } else {
      setPreviewUrl(null);
    }
  }, [currentImage]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, WEBP)');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      if (type) {
        formData.append('type', type);
      }

      // Determine the upload endpoint
      const endpoint = uploadPath || '/api/upload';

      // Upload the file
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload image');
      }

      const data = await response.json();
      
      // Use the direct path to the image instead of going through the serve-image API
      const imageUrl = data.url;
      
      // Set the preview URL and call the callback
      setPreviewUrl(`${window.location.origin}${imageUrl}`);
      onImageUploaded(imageUrl);
      
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageUploaded('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`w-full ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative w-full h-40 rounded-md overflow-hidden border border-gray-700">
          <Image 
            src={previewUrl} 
            alt="Preview" 
            fill 
            className="object-cover"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
            title="Remove image"
          >
            <FaTrash size={14} />
          </button>
        </div>
      ) : (
        <div 
          onClick={triggerFileInput}
          className="w-full h-40 border-2 border-dashed border-gray-700 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
        >
          {isUploading ? (
            <>
              <FaSpinner className="animate-spin text-3xl text-primary mb-2" />
              <p className="text-sm text-gray-400">Uploading...</p>
            </>
          ) : (
            <>
              <FaUpload className="text-3xl text-gray-400 mb-2" />
              <p className="text-sm text-gray-400">Click to upload an image</p>
              <p className="text-xs text-gray-500 mt-1">JPEG, PNG, GIF, WEBP (max 5MB)</p>
            </>
          )}
        </div>
      )}
    </div>
  );
} 