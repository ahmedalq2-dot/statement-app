
import React, { useRef } from 'react';

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelect, isLoading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = (Array.from(e.dataTransfer.files) as File[]).filter(file => file.type === 'application/pdf');
    if (files.length > 0) {
      onFilesSelect(files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = (Array.from(e.target.files || []) as File[]).filter(file => file.type === 'application/pdf');
    if (files.length > 0) {
      onFilesSelect(files);
    }
  };

  return (
    <div 
      className={`relative border-2 border-dashed rounded-xl p-10 transition-all text-center
        ${isLoading ? 'border-gray-200 bg-gray-50' : 'border-blue-300 bg-blue-50 hover:border-blue-500 hover:bg-blue-100'}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        multiple
        className="hidden"
        disabled={isLoading}
      />
      
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isLoading ? 'bg-gray-200 text-gray-400' : 'bg-blue-200 text-blue-600'}`}>
          <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-cloud-upload-alt'} text-2xl`}></i>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {isLoading ? 'Processing Statements...' : 'Upload Bank Statements'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Drag and drop your bank statement PDFs here, or click to browse
          </p>
        </div>

        {!isLoading && (
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            Select PDFs
          </button>
        )}

        {isLoading && (
          <div className="w-full max-w-xs bg-gray-200 rounded-full h-1.5 mt-4">
            <div className="bg-blue-600 h-1.5 rounded-full animate-[shimmer_2s_infinite] w-3/4"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
