'use client';

import * as React from 'react';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileText } from 'lucide-react';

interface StockUploaderProps {
  productId: string;
  onSuccess: () => void;
}

export default function StockUploader({ productId, onSuccess }: StockUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.txt')) {
        setError('Only .txt files are accepted');
        setFile(null);
      } else {
        setFile(selectedFile);
        setError(null);
      }
      setSuccess(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files?.[0] || null);
  };

  const onDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0] || null;
    handleFileSelect(droppedFile);
  };

  const removeFile = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setFile(null);
    const fileInput = document.getElementById(`file-input-${productId}`) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('productId', productId);
      formData.append('file', file);

      const response = await fetch('/api/admin/stock/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        const { count, duplicates } = result;
        let successMessage = `Successfully added ${count || 0} new stock items.`;
        if (duplicates > 0) {
          successMessage += ` ${duplicates} duplicate items were skipped.`;
        }
        setSuccess(successMessage);
        setFile(null);
        onSuccess();
      } else {
        setError(result.error || 'Failed to upload stock');
      }
    } catch (err) {
      setError('An error occurred while uploading the file');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <label
          htmlFor={`file-input-${productId}`}
          className={`block cursor-pointer border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-300
            ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'}`}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          {file ? (
            <div className="flex items-center justify-center flex-col">
              <FileText className="w-12 h-12 text-gray-400" />
              <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">{file.name}</p>
              <button
                type="button"
                onClick={removeFile}
                className="mt-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 text-xs font-semibold"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2">
              <UploadCloud className="w-12 h-12 text-gray-400" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-blue-600 dark:text-blue-400">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">.txt files only</p>
            </div>
          )}
        </label>
        <input
          id={`file-input-${productId}`}
          type="file"
          accept=".txt"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      
      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-500">{success}</p>}

      <Button 
        type="submit" 
        className="w-full"
        disabled={isUploading || !file}
      >
        {isUploading ? 'Uploading...' : 'Upload Stock'}
      </Button>
    </form>
  );
} 