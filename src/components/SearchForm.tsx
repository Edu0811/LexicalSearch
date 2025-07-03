import React, { useState, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { FileData } from '../types';

interface SearchFormProps {
  files: FileData[];
  onSearch: (term: string, selectedFileIds: string[]) => void;
  isSearching: boolean;
}

const SearchForm: React.FC<SearchFormProps> = ({ files, onSearch, isSearching }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim() && files.length > 0) {
      // Use all available files since selection is now handled in the file source components
      const allFileIds = files.map(f => f.id);
      onSearch(searchTerm.trim(), allFileIds);
    }
  }, [searchTerm, files, onSearch]);

  if (files.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/50 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Search Configuration</h2>
        <p className="text-slate-500 text-center py-8">
          Select files first to start searching
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/50 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Search Configuration</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Search Term Input */}
        <div>
          <label htmlFor="search-term" className="block text-sm font-medium text-slate-700 mb-2">
            Search Term
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              id="search-term"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter term to search for..."
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled={isSearching}
            />
          </div>
        </div>

        {/* Selected Files Info */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-900">Ready to Search</h3>
            <span className="text-sm text-blue-700 font-medium">{files.length} files selected</span>
          </div>
          <div className="space-y-1">
            {files.slice(0, 3).map((file) => (
              <p key={file.id} className="text-xs text-blue-800 truncate">
                • {file.name}
              </p>
            ))}
            {files.length > 3 && (
              <p className="text-xs text-blue-700 italic">
                ... and {files.length - 3} more files
              </p>
            )}
          </div>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          disabled={!searchTerm.trim() || files.length === 0 || isSearching}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isSearching ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Searching...</span>
            </>
          ) : (
            <>
              <Search className="h-5 w-5" />
              <span>Search Files</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default SearchForm;