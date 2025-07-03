import React, { useState } from 'react';
import { Download, FileText, Loader2, CheckCircle } from 'lucide-react';
import { SearchResult } from '../types';
import { exportToDocx, exportToPdf } from '../utils/exportUtils';

interface ExportPanelProps {
  searchResults: SearchResult[];
  searchTerm: string;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ searchResults, searchTerm }) => {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<string | null>(null);

  const handleExport = async (format: 'docx' | 'pdf') => {
    if (searchResults.length === 0) return;

    setIsExporting(format);
    try {
      if (format === 'docx') {
        await exportToDocx(searchResults, searchTerm);
      } else {
        await exportToPdf(searchResults, searchTerm);
      }
      setLastExport(format);
      setTimeout(() => setLastExport(null), 3000);
    } catch (error) {
      console.error(`Export to ${format.toUpperCase()} failed:`, error);
      alert(`Failed to export to ${format.toUpperCase()}. Please try again.`);
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/50 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Export Results</h2>
      
      {searchResults.length === 0 ? (
        <p className="text-slate-500 text-center py-4">
          No search results to export
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-600 mb-4">
            Export your search results for "{searchTerm}" to a document format.
          </p>
          
          {/* DOCX Export */}
          <button
            onClick={() => handleExport('docx')}
            disabled={isExporting !== null}
            className="w-full flex items-center justify-center space-x-3 p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting === 'docx' ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : lastExport === 'docx' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <FileText className="h-5 w-5" />
            )}
            <span className="font-medium">
              {isExporting === 'docx' ? 'Generating DOCX...' : 
               lastExport === 'docx' ? 'DOCX Downloaded!' : 'Export to DOCX'}
            </span>
          </button>

          {/* PDF Export */}
          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting !== null}
            className="w-full flex items-center justify-center space-x-3 p-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting === 'pdf' ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : lastExport === 'pdf' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Download className="h-5 w-5" />
            )}
            <span className="font-medium">
              {isExporting === 'pdf' ? 'Generating PDF...' : 
               lastExport === 'pdf' ? 'PDF Downloaded!' : 'Export to PDF'}
            </span>
          </button>

          {/* Export Info */}
          <div className="mt-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600">
              <strong>Export includes:</strong> Search term, file sources, found paragraphs with highlighting, and search statistics.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportPanel;