import React from 'react';
import { Upload, FolderOpen } from 'lucide-react';
import { FileSourceMode } from '../types';

interface FileSourceToggleProps {
  mode: FileSourceMode;
  onModeChange: (mode: FileSourceMode) => void;
}

const FileSourceToggle: React.FC<FileSourceToggleProps> = ({ mode, onModeChange }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/50 p-4 mb-6">
      <h3 className="text-sm font-medium text-slate-700 mb-3">File Source</h3>
      <div className="flex bg-slate-100 rounded-lg p-1">
        <button
          onClick={() => onModeChange('data-folder')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
            mode === 'data-folder'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FolderOpen className="h-4 w-4" />
          <span>Data Folder</span>
        </button>
        <button
          onClick={() => onModeChange('upload')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
            mode === 'upload'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Upload className="h-4 w-4" />
          <span>Upload Files</span>
        </button>
      </div>
    </div>
  );
};

export default FileSourceToggle;