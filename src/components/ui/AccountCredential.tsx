'use client';

import * as React from 'react';
import { useState } from 'react';
import { FaEye, FaEyeSlash, FaCopy } from 'react-icons/fa';

interface AccountCredentialProps {
  content: string;
}

export const AccountCredential = ({ content }: AccountCredentialProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Format the content for display
  const formatContent = () => {
    if (!isVisible) {
      return '••••••••••••••••••••••••••';
    }
    return content;
  };

  return (
    <div className="bg-black/40 rounded-md p-3 border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-gray-400">Hesap Bilgileri</span>
        <div className="flex space-x-2">
          <button
            onClick={toggleVisibility}
            className="text-gray-400 hover:text-white transition-colors p-1"
            aria-label={isVisible ? 'Bilgileri gizle' : 'Bilgileri göster'}
            title={isVisible ? 'Bilgileri gizle' : 'Bilgileri göster'}
          >
            {isVisible ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
          </button>
          <button
            onClick={copyToClipboard}
            className="text-gray-400 hover:text-white transition-colors p-1"
            aria-label="Panoya kopyala"
            title="Panoya kopyala"
          >
            <FaCopy size={14} />
          </button>
        </div>
      </div>
      <div className="font-mono text-sm bg-black/40 p-2 rounded overflow-x-auto whitespace-pre-wrap break-all">
        {formatContent()}
      </div>
      {copied && (
        <div className="text-xs text-green-400 mt-2 text-right">
          Panoya kopyalandı!
        </div>
      )}
    </div>
  );
}; 