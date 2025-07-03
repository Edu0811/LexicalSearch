import React, { useCallback, useState } from 'react';
import { Upload, File, X, AlertCircle } from 'lucide-react';
import { FileData } from '../types';

interface FileUploadProps {
  onFilesUploaded: (files: FileData[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesUploaded }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<FileData[]>([]);
  const [error, setError] = useState<string>('');

  const processFiles = useCallback(async (fileList: FileList) => {
    const processedFiles: FileData[] = [];
    const errors: string[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      
      // Check file type
      if (!file.type.includes('text') && !file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
        errors.push(`${file.name}: Unsupported file type. Please upload text or markdown files.`);
        continue;
      }

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: File too large. Maximum size is 10MB.`);
        continue;
      }

      try {
        const content = await file.text();
        processedFiles.push({
          id: `${file.name}-${Date.now()}-${i}`,
          name: file.name,
          content,
          size: file.size,
          type: file.type || 'text/plain'
        });
      } catch (err) {
        errors.push(`${file.name}: Failed to read file content.`);
      }
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
    } else {
      setError('');
    }

    if (processedFiles.length > 0) {
      const updatedFiles = [...files, ...processedFiles];
      setFiles(updatedFiles);
      onFilesUploaded(updatedFiles);
    }
  }, [files, onFilesUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
  }, [processFiles]);

  const removeFile = useCallback((fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    onFilesUploaded(updatedFiles);
  }, [files, onFilesUploaded]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/50 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Upload Files</h2>
      
      {/* Drop Zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
          }
        `}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
      >
        <Upload className={`mx-auto h-12 w-12 mb-4 ${isDragOver ? 'text-blue-500' : 'text-slate-400'}`} />
        <p className="text-slate-600 mb-2">
          Drop your files here, or{' '}
          <label className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
            browse
            <input
              type="file"
              multiple
              accept=".txt,.md,text/*"
              className="hidden"
              onChange={handleFileInput}
            />
          </label>
        </p>
        <p className="text-sm text-slate-500">Supports .txt, .md files up to 10MB</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200/50 rounded-lg flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700 whitespace-pre-line">{error}</div>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-slate-700 mb-3">
            Uploaded Files ({files.length})
          </h3>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200/50"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <File className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                  title="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;