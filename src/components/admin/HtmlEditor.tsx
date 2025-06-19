'use client';

import React, { useState, useRef, useEffect } from 'react';

interface HtmlEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const HtmlEditor: React.FC<HtmlEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter description here...',
  className = '',
}) => {
  const [isDesignMode, setIsDesignMode] = useState(true);
  const [internalValue, setInternalValue] = useState(value);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync internal value with external value
  useEffect(() => {
    setInternalValue(value);
    if (contentEditableRef.current && isDesignMode) {
      contentEditableRef.current.innerHTML = value;
    }
  }, [value, isDesignMode]);

  // Update the contentEditable when switching to design mode
  useEffect(() => {
    if (isDesignMode && contentEditableRef.current) {
      contentEditableRef.current.innerHTML = internalValue;
    }
  }, [isDesignMode, internalValue]);

  // Handle design mode changes
  const handleDesignChange = () => {
    if (contentEditableRef.current) {
      const newValue = contentEditableRef.current.innerHTML;
      setInternalValue(newValue);
      onChange(newValue);
    }
  };

  // Handle code mode changes
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange(newValue);
  };

  // Handle toolbar button clicks
  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    handleDesignChange();
    contentEditableRef.current?.focus();
  };

  // Basic HTML sanitization
  const sanitizeHtml = (html: string): string => {
    // Remove potentially dangerous tags and attributes
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/g, '')
      .replace(/on\w+='[^']*'/g, '');
  };

  // Focus the appropriate editor when switching modes
  useEffect(() => {
    if (isDesignMode) {
      contentEditableRef.current?.focus();
    } else {
      textareaRef.current?.focus();
    }
  }, [isDesignMode]);

  // Adjust textarea height based on content
  useEffect(() => {
    if (!isDesignMode && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [internalValue, isDesignMode]);

  return (
    <div className={`html-editor ${className}`}>
      <div className="html-editor-toolbar flex flex-wrap gap-2 mb-2">
        <div className="flex border border-gray-700 rounded-md overflow-hidden">
          <button
            type="button"
            className={`px-3 py-1 text-sm ${isDesignMode ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            onClick={() => setIsDesignMode(true)}
          >
            Design
          </button>
          <button
            type="button"
            className={`px-3 py-1 text-sm ${!isDesignMode ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            onClick={() => setIsDesignMode(false)}
          >
            HTML
          </button>
        </div>

        {isDesignMode && (
          <div className="flex gap-1 border border-gray-700 rounded-md overflow-hidden">
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-300"
              onClick={() => execCommand('bold')}
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-300"
              onClick={() => execCommand('italic')}
              title="Italic"
            >
              <em>I</em>
            </button>
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-300"
              onClick={() => execCommand('underline')}
              title="Underline"
            >
              <u>U</u>
            </button>
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-300"
              onClick={() => execCommand('insertUnorderedList')}
              title="Bullet List"
            >
              •
            </button>
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-300"
              onClick={() => execCommand('insertOrderedList')}
              title="Numbered List"
            >
              1.
            </button>
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-300"
              onClick={() => {
                const url = prompt('Enter link URL:');
                if (url) execCommand('createLink', url);
              }}
              title="Insert Link"
            >
              🔗
            </button>
          </div>
        )}
      </div>

      {isDesignMode ? (
        <div
          ref={contentEditableRef}
          contentEditable
          className="admin-input w-full min-h-[300px] overflow-y-auto p-3"
          onInput={handleDesignChange}
          onBlur={() => {
            // Sanitize HTML on blur
            if (contentEditableRef.current) {
              const sanitized = sanitizeHtml(contentEditableRef.current.innerHTML);
              contentEditableRef.current.innerHTML = sanitized;
              setInternalValue(sanitized);
              onChange(sanitized);
            }
          }}
          onPaste={(e) => {
            // Allow HTML paste
            e.preventDefault();
            const text = e.clipboardData.getData('text/html') || e.clipboardData.getData('text');
            document.execCommand('insertHTML', false, text);
            handleDesignChange();
          }}
          dangerouslySetInnerHTML={{ __html: internalValue || placeholder }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={internalValue}
          onChange={handleCodeChange}
          className="admin-input w-full min-h-[300px] font-mono text-sm"
          placeholder={placeholder}
          style={{
            resize: 'vertical',
            height: '300px',
          }}
        />
      )}
    </div>
  );
};

export default HtmlEditor; 