import React, { useState, useCallback } from 'react';

const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

interface FileUploadProps {
  onJsonLoad: (data: object, fileName: string) => void;
  onJsonError: (error: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onJsonLoad, onJsonError }) => {
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const trimmedText = text.trim();

        if (!trimmedText) {
          onJsonError("The uploaded file is empty.");
          return;
        }

        if (!trimmedText.startsWith('{') && !trimmedText.startsWith('[')) {
          onJsonError("The uploaded file does not appear to be in JSON format. Valid JSON must start with an object ({) or an array ([]).");
          return;
        }
        
        const data = JSON.parse(text);
        onJsonLoad(data, file.name);
      } catch (error) {
        onJsonError(`Invalid JSON syntax in file "${file.name}". Please check the file for errors.`);
      }
    };
    reader.onerror = () => {
      onJsonError('Failed to read the file.');
    };
    reader.readAsText(file);
  }, [onJsonLoad, onJsonError]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [processFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-light-card dark:bg-dark-card rounded-lg shadow-md overflow-hidden p-8">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all duration-300 ${
          isDragging
            ? 'border-brand-primary bg-teal-50 dark:bg-teal-900/20'
            : 'border-slate-300 dark:border-slate-600 hover:border-brand-secondary'
        }`}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".json,.txt"
          onChange={handleFileChange}
        />
        <label htmlFor="file-upload" className="flex flex-col items-center justify-center space-y-4 cursor-pointer">
          <UploadIcon className="h-12 w-12 text-slate-400" />
          <p className="text-lg font-semibold text-light-text dark:text-dark-text">
            <span className="text-brand-primary font-bold">Click to upload a file</span>
          </p>
           <p className="text-slate-500 dark:text-slate-400">or drag and drop it here</p>
        </label>
      </div>
    </div>
  );
};
