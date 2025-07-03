import React, { useState, useEffect, useCallback } from 'react';
import { FolderOpen, File, CheckSquare, Square, AlertCircle, RefreshCw } from 'lucide-react';
import { DataFolderFile, FileData } from '../types';

interface DataFolderSelectorProps {
  onFilesSelected: (files: FileData[]) => void;
}

const DataFolderSelector: React.FC<DataFolderSelectorProps> = ({ onFilesSelected }) => {
  const [availableFiles, setAvailableFiles] = useState<DataFolderFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const loadDataFolderFiles = useCallback(async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // List of actual files in the data folder
      const actualFiles = [
        'PROEXIS.md',
        'TNP.md', 
        '200TEAT.md',
        'DUPLA.md',
        'PROJ-I.md',
        'TEMAS.md',
        '700EXP.md',
        'LO.md',
        'LO (2019) - Numbers (Bilbiomancia).md'
      ];
      
      const files: DataFolderFile[] = [];
      
      // Check which files actually exist and get their info
      for (const fileName of actualFiles) {
        try {
          const response = await fetch(`/data/${encodeURIComponent(fileName)}`, { method: 'HEAD' });
          if (response.ok) {
            const contentLength = response.headers.get('content-length');
            files.push({
              name: fileName,
              path: `/data/${encodeURIComponent(fileName)}`,
              size: contentLength ? parseInt(contentLength) : 0,
              type: fileName.endsWith('.md') ? 'text/markdown' : 'text/plain'
            });
          }
        } catch (err) {
          console.log(`File ${fileName} not accessible, skipping`);
        }
      }
      
      if (files.length === 0) {
        setError('No accessible files found in data folder');
        setAvailableFiles([]);
        onFilesSelected([]);
        return;
      }
      
      setAvailableFiles(files);
      
      // Auto-select all files by default
      const allFileNames = new Set(files.map(f => f.name));
      setSelectedFiles(allFileNames);
      
      // Load content for all files and notify parent
      await loadSelectedFilesContent(files, allFileNames);
      
    } catch (err) {
      setError('Failed to load files from data folder');
      console.error('Error loading data folder files:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadSelectedFilesContent = useCallback(async (files: DataFolderFile[], selectedNames: Set<string>) => {
    const fileDataList: FileData[] = [];
    const errors: string[] = [];
    
    for (const file of files) {
      if (selectedNames.has(file.name)) {
        try {
          const response = await fetch(file.path);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const content = await response.text();
          
          fileDataList.push({
            id: `data-${file.name}-${Date.now()}`,
            name: file.name,
            content,
            size: content.length,
            type: file.type
          });
        } catch (err) {
          console.error(`Error loading file ${file.name}:`, err);
          errors.push(`Failed to load ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
    }
    
    if (errors.length > 0) {
      setError(errors.join('\n'));
    } else {
      setError('');
    }
    
    onFilesSelected(fileDataList);
  }, [onFilesSelected]);

  useEffect(() => {
    loadDataFolderFiles();
  }, [loadDataFolderFiles]);

  const handleFileToggle = useCallback((fileName: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileName)) {
      newSelected.delete(fileName);
    } else {
      newSelected.add(fileName);
    }
    setSelectedFiles(newSelected);
    
    // Load content for selected files
    loadSelectedFilesContent(availableFiles, newSelected);
  }, [selectedFiles, availableFiles, loadSelectedFilesContent]);

  const handleSelectAll = useCallback(() => {
    if (selectedFiles.size === availableFiles.length) {
      setSelectedFiles(new Set());
      onFilesSelected([]);
    } else {
      const allFileNames = new Set(availableFiles.map(f => f.name));
      setSelectedFiles(allFileNames);
      loadSelectedFilesContent(availableFiles, allFileNames);
    }
  }, [availableFiles, selectedFiles, onFilesSelected, loadSelectedFilesContent]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/50 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Data Folder Files</h2>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 text-blue-500 animate-spin mr-3" />
          <span className="text-slate-600">Loading files from data folder...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/50 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <FolderOpen className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-slate-900">Data Folder Files</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200/50 rounded-lg flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700 whitespace-pre-line">{error}</div>
        </div>
      )}

      {availableFiles.length === 0 ? (
        <div className="text-center py-8">
          <FolderOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 mb-2">No files found in data folder</p>
          <button
            onClick={loadDataFolderFiles}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Selection Controls */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              Select Files ({selectedFiles.size}/{availableFiles.length})
            </span>
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {selectedFiles.size === availableFiles.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {/* File List */}
          <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
            {availableFiles.map((file) => (
              <label
                key={file.name}
                className="flex items-center p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
              >
                <div className="flex items-center space-x-3 flex-1">
                  {selectedFiles.has(file.name) ? (
                    <CheckSquare 
                      className="h-5 w-5 text-blue-600" 
                      onClick={(e) => {
                        e.preventDefault();
                        handleFileToggle(file.name);
                      }}
                    />
                  ) : (
                    <Square 
                      className="h-5 w-5 text-slate-400" 
                      onClick={(e) => {
                        e.preventDefault();
                        handleFileToggle(file.name);
                      }}
                    />
                  )}
                  <File className="h-4 w-4 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      {file.type === 'text/markdown' ? 'Markdown' : 'Text'} • {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataFolderSelector;