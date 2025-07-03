import React, { useState } from 'react';
import { FileText, Search, ChevronDown, ChevronRight, BarChart3 } from 'lucide-react';
import { SearchResult } from '../types';
import ReactMarkdown from 'react-markdown';

interface SearchResultsProps {
  results: SearchResult[];
  searchTerm: string;
  isSearching: boolean;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, searchTerm, isSearching }) => {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const toggleFileExpansion = (fileName: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(fileName)) {
      newExpanded.delete(fileName);
    } else {
      newExpanded.add(fileName);
    }
    setExpandedFiles(newExpanded);
  };

  const highlightSearchTerm = (text: string, term: string): string => {
    if (!term.trim()) return text;
    
    // Escape special regex characters in the search term
    const escapedTerm = term.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Simple approach: directly replace all occurrences with bold markdown
    // Use global case-insensitive replacement
    const regex = new RegExp(`(${escapedTerm})`, 'gi');
    
    // Split the text by the search term while preserving the matches
    const parts = text.split(regex);
    
    // Rebuild the text, wrapping matches in bold markdown
    let result = '';
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      // Check if this part matches our search term (case-insensitive)
      if (regex.test(part)) {
        // Reset regex lastIndex since we're reusing it
        regex.lastIndex = 0;
        result += `**${part}**`;
      } else {
        result += part;
      }
    }
    
    return result;
  };

  if (isSearching) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/50 p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">Searching...</h3>
          <p className="text-slate-600">Processing your files for "{searchTerm}"</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/50 p-8">
        <div className="text-center">
          <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No Search Performed</h3>
          <p className="text-slate-600">
            Select files and enter a search term to get started
          </p>
        </div>
      </div>
    );
  }

  const totalParagraphs = results.reduce((sum, result) => sum + result.foundParagraphs.length, 0);
  const totalOccurrences = results.reduce((sum, result) => sum + result.occurrenceCount, 0);

  return (
    <div className="space-y-6">
      {/* Search Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/50 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-900">
            Search Results for "{searchTerm}"
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-700">Files Searched</p>
            <p className="text-2xl font-bold text-blue-900">{results.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm font-medium text-green-700">Paragraphs Found</p>
            <p className="text-2xl font-bold text-green-900">{totalParagraphs}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm font-medium text-purple-700">Total Occurrences</p>
            <p className="text-2xl font-bold text-purple-900">{totalOccurrences}</p>
          </div>
        </div>
      </div>

      {/* Results by File */}
      <div className="space-y-4">
        {results.map((result) => (
          <div key={result.fileName} className="bg-white rounded-xl shadow-sm border border-slate-200/50">
            <button
              onClick={() => toggleFileExpansion(result.fileName)}
              className="w-full p-6 text-left hover:bg-slate-50 transition-colors rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-slate-400" />
                  <div>
                    <h3 className="font-semibold text-slate-900">{result.fileName}</h3>
                    <p className="text-sm text-slate-600">
                      Total paragraphs in this file: {result.totalParagraphs}
                    </p>
                    <p className="text-sm text-slate-600">
                      Paragraphs with term "{searchTerm}": <strong>{result.foundParagraphs.length}</strong>
                      {result.occurrenceCount > result.foundParagraphs.length && 
                        ` (${result.occurrenceCount} total occurrences)`
                      }
                    </p>
                  </div>
                </div>
                {expandedFiles.has(result.fileName) ? (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </button>

            {expandedFiles.has(result.fileName) && (
              <div className="px-6 pb-6 border-t border-slate-100">
                {result.foundParagraphs.length === 0 ? (
                  <p className="text-slate-500 italic py-4">No paragraphs found with the search term.</p>
                ) : (
                  <div className="space-y-4 mt-4">
                    {result.foundParagraphs.map((paragraph, index) => {
                      // Apply highlighting before passing to ReactMarkdown
                      const highlightedText = highlightSearchTerm(paragraph.trim(), searchTerm);
                      
                      return (
                        <div key={index} className="bg-slate-50 rounded-lg p-4 border-l-4 border-blue-500">
                          <div className="flex items-start space-x-3">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 mt-1">
                              {index + 1}
                            </span>
                            <div className="flex-1 prose prose-sm max-w-none">
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => <p className="text-slate-700 leading-relaxed mb-2 last:mb-0">{children}</p>,
                                  strong: ({ children, ...props }) => {
                                    // Check if this strong element contains our search term highlighting
                                    const childText = React.Children.toArray(children).join('');
                                    const isSearchHighlight = typeof childText === 'string' && 
                                      new RegExp(searchTerm.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(childText);
                                    
                                    if (isSearchHighlight) {
                                      return <strong className="bg-yellow-200 text-yellow-900 px-1 rounded font-semibold" {...props}>{children}</strong>;
                                    } else {
                                      return <strong className="font-bold text-slate-900" {...props}>{children}</strong>;
                                    }
                                  },
                                  em: ({ children }) => <em className="text-slate-600">{children}</em>,
                                  code: ({ children }) => <code className="bg-slate-200 text-slate-800 px-1 rounded text-sm">{children}</code>,
                                  h1: ({ children }) => <h1 className="text-lg font-bold text-slate-900 mb-2">{children}</h1>,
                                  h2: ({ children }) => <h2 className="text-base font-bold text-slate-900 mb-2">{children}</h2>,
                                  h3: ({ children }) => <h3 className="text-sm font-bold text-slate-900 mb-1">{children}</h3>,
                                  ul: ({ children }) => <ul className="list-disc list-inside text-slate-700 space-y-1">{children}</ul>,
                                  ol: ({ children }) => <ol className="list-decimal list-inside text-slate-700 space-y-1">{children}</ol>,
                                  li: ({ children }) => <li className="text-slate-700">{children}</li>,
                                  blockquote: ({ children }) => <blockquote className="border-l-4 border-slate-300 pl-4 italic text-slate-600">{children}</blockquote>,
                                }}
                              >
                                {highlightedText}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;