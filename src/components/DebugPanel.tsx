import React, { useState } from 'react';
import { Bug, ChevronDown, ChevronRight, FileText, Scissors, Target, Settings } from 'lucide-react';
import { DebugInfo } from '../types';

interface DebugPanelProps {
  debugInfo: DebugInfo[];
  searchTerm: string;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ debugInfo, searchTerm }) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpansion = (key: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedItems(newExpanded);
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const highlightSearchTerm = (text: string, term: string) => {
    if (!term.trim()) return text;
    
    const regex = new RegExp(`(${term.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded font-semibold">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  if (debugInfo.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/50 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Bug className="h-6 w-6 text-orange-600" />
          <h2 className="text-lg font-semibold text-slate-900">Debug Panel</h2>
        </div>
        <p className="text-slate-500 text-center py-8">
          No debug information available. Perform a search to see processing details.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/50 p-6 max-h-screen overflow-y-auto">
      <div className="flex items-center space-x-3 mb-6">
        <Bug className="h-6 w-6 text-orange-600" />
        <h2 className="text-lg font-semibold text-slate-900">Debug Panel</h2>
      </div>

      <div className="space-y-4">
        {debugInfo.map((info, index) => {
          const itemKey = `${info.fileName}-${info.paragraphIndex}`;
          const isExpanded = expandedItems.has(itemKey);
          const details = info.debugDetails;
          const isFileSplitInfo = info.paragraphIndex === 0;

          return (
            <div key={itemKey} className="border border-slate-200 rounded-lg">
              <button
                onClick={() => toggleExpansion(itemKey)}
                className="w-full p-4 text-left hover:bg-slate-50 transition-colors rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {isFileSplitInfo ? (
                      <Settings className="h-4 w-4 text-purple-400" />
                    ) : (
                      <FileText className="h-4 w-4 text-slate-400" />
                    )}
                    <div>
                      <p className="font-medium text-slate-900 text-sm">
                        {isFileSplitInfo 
                          ? `${info.fileName} - File Split Analysis`
                          : `${info.fileName} - Paragraph ${info.paragraphIndex}`
                        }
                      </p>
                      <p className="text-xs text-slate-500">
                        {isFileSplitInfo 
                          ? `Split method: ${details.splitInfo?.chosenMethod || 'Unknown'}`
                          : details.containsPipe ? `Has ${details.splitCount} pipe sections` : 'No pipe processing'
                        }
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-slate-100 space-y-4">
                  {isFileSplitInfo ? (
                    /* File Split Analysis */
                    <div className="space-y-4">
                      <div className="bg-purple-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Settings className="h-4 w-4 text-purple-600" />
                          <h4 className="font-medium text-purple-900 text-sm">Text Splitting Analysis</h4>
                        </div>
                        {details.splitInfo && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="font-medium text-purple-700">File Length:</span>
                                <p className="text-purple-600">{details.splitInfo.originalLength} chars</p>
                              </div>
                              <div>
                                <span className="font-medium text-purple-700">Line Endings:</span>
                                <p className="text-purple-600">
                                  {details.splitInfo.hasWindowsLineEndings ? 'Windows (\\r\\n)' : 
                                   details.splitInfo.hasCarriageReturns ? 'Mixed' : 'Unix (\\n)'}
                                </p>
                              </div>
                              <div>
                                <span className="font-medium text-purple-700">Double \\n\\n:</span>
                                <p className="text-purple-600">{details.splitInfo.doubleNewlineCount}</p>
                              </div>
                              <div>
                                <span className="font-medium text-purple-700">Single \\n:</span>
                                <p className="text-purple-600">{details.splitInfo.singleNewlineCount}</p>
                              </div>
                            </div>
                            
                            <div className="mt-3">
                              <p className="text-xs font-medium text-purple-800 mb-2">Split Method Comparison:</p>
                              <div className="space-y-1">
                                {details.splitInfo.splitMethods.map((method, idx) => (
                                  <div key={idx} className={`text-xs p-2 rounded border-l-2 ${
                                    method.name === details.splitInfo?.chosenMethod 
                                      ? 'bg-green-50 border-green-400 text-green-800' 
                                      : 'bg-slate-50 border-slate-300 text-slate-700'
                                  }`}>
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-medium">{method.name}</span>
                                      <span className="text-xs opacity-75">
                                        {method.paragraphCount} paragraphs (avg: {method.avgLength} chars)
                                      </span>
                                    </div>
                                    {method.sample.length > 0 && (
                                      <div className="text-xs opacity-75">
                                        Sample: "{method.sample[0]}"
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-blue-50 rounded-lg p-3">
                        <h4 className="font-medium text-blue-900 text-sm mb-2">File Content Preview</h4>
                        <p className="text-xs text-blue-800 leading-relaxed font-mono">
                          {details.originalParagraph}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Regular Paragraph Processing */
                    <div className="space-y-4">
                      {/* Original Paragraph */}
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Target className="h-4 w-4 text-blue-600" />
                          <h4 className="font-medium text-blue-900 text-sm">Original Paragraph</h4>
                        </div>
                        <p className="text-xs text-blue-800 leading-relaxed">
                          {highlightSearchTerm(details.originalParagraph, searchTerm)}
                        </p>
                      </div>

                      {/* Pipe Processing Details */}
                      {details.containsPipe && (
                        <div className="bg-yellow-50 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <Scissors className="h-4 w-4 text-yellow-600" />
                            <h4 className="font-medium text-yellow-900 text-sm">
                              Pipe Processing ({details.splitCount} sections)
                            </h4>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-medium text-yellow-800 mb-1">Split Sentences:</p>
                              <div className="space-y-1">
                                {details.sentences.map((sentence, idx) => (
                                  <p key={idx} className="text-xs text-yellow-700 pl-2 border-l-2 border-yellow-300">
                                    {idx + 1}. {sentence}
                                  </p>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-yellow-800 mb-1">Selection Logic:</p>
                              <div className="space-y-1">
                                {details.selectedSentences.map((sentence, idx) => {
                                  const isBase = sentence.startsWith('[BASE]');
                                  const isMatch = sentence.startsWith('[MATCH]');
                                  const isSkip = sentence.startsWith('[SKIP]');
                                  
                                  return (
                                    <p key={idx} className={`text-xs pl-2 border-l-2 ${
                                      isBase ? 'text-green-700 border-green-300 bg-green-50' :
                                      isMatch ? 'text-blue-700 border-blue-300 bg-blue-50' :
                                      'text-red-700 border-red-300 bg-red-50'
                                    }`}>
                                      {sentence}
                                    </p>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Final Result */}
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Target className="h-4 w-4 text-green-600" />
                          <h4 className="font-medium text-green-900 text-sm">Final Processed Paragraph</h4>
                        </div>
                        <p className="text-xs text-green-800 leading-relaxed">
                          {highlightSearchTerm(details.finalParagraph, searchTerm)}
                        </p>
                      </div>

                      {/* Processing Summary */}
                      <div className="bg-slate-50 rounded-lg p-3">
                        <h4 className="font-medium text-slate-900 text-sm mb-2">Processing Summary</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="font-medium text-slate-700">Search Term:</span>
                            <p className="text-slate-600">"{details.searchTerm}"</p>
                          </div>
                          <div>
                            <span className="font-medium text-slate-700">Has Pipes:</span>
                            <p className="text-slate-600">{details.containsPipe ? 'Yes' : 'No'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-slate-700">Original Length:</span>
                            <p className="text-slate-600">{details.originalParagraph.length} chars</p>
                          </div>
                          <div>
                            <span className="font-medium text-slate-700">Final Length:</span>
                            <p className="text-slate-600">{details.finalParagraph.length} chars</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DebugPanel;