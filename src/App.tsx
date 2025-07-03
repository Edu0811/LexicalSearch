import React, { useState, useCallback } from 'react';
import FileUpload from './components/FileUpload';
import DataFolderSelector from './components/DataFolderSelector';
import FileSourceToggle from './components/FileSourceToggle';
import SearchForm from './components/SearchForm';
import SearchResults from './components/SearchResults';
import ExportPanel from './components/ExportPanel';
import DebugPanel from './components/DebugPanel';
import { FileData, SearchResult, DebugInfo, FileSourceMode } from './types';

function App() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [fileSourceMode, setFileSourceMode] = useState<FileSourceMode>('data-folder');

  const handleFilesUploaded = useCallback((uploadedFiles: FileData[]) => {
    setFiles(uploadedFiles);
    setSearchResults([]);
    setDebugInfo([]);
  }, []);

  const handleFilesSelected = useCallback((selectedFiles: FileData[]) => {
    setFiles(selectedFiles);
    setSearchResults([]);
    setDebugInfo([]);
  }, []);

  const handleModeChange = useCallback((mode: FileSourceMode) => {
    setFileSourceMode(mode);
    setFiles([]);
    setSearchResults([]);
    setDebugInfo([]);
  }, []);

  /**
   * ENHANCED TEXT SPLITTING FUNCTION
   * 
   * This function handles various line ending formats and splitting scenarios
   * to ensure proper paragraph separation regardless of file origin.
   */
  const splitTextIntoParagraphs = useCallback((text: string): { paragraphs: string[], splitInfo: any } => {
    // Normalize line endings first (convert all to \n)
    const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    const splitInfo = {
      originalLength: text.length,
      normalizedLength: normalizedText.length,
      hasCarriageReturns: text.includes('\r'),
      hasWindowsLineEndings: text.includes('\r\n'),
      doubleNewlineCount: (normalizedText.match(/\n\n/g) || []).length,
      singleNewlineCount: (normalizedText.match(/\n/g) || []).length,
      splitMethods: [] as any[]
    };

    // Try different splitting methods
    const methods = [
      {
        name: 'Double newline (\\n\\n)',
        splitter: '\n\n',
        result: normalizedText.split('\n\n').filter(p => p.trim())
      },
      {
        name: 'Single newline (\\n)',
        splitter: '\n',
        result: normalizedText.split('\n').filter(p => p.trim())
      },
      {
        name: 'Triple newline (\\n\\n\\n)',
        splitter: '\n\n\n',
        result: normalizedText.split('\n\n\n').filter(p => p.trim())
      },
      {
        name: 'Regex: 2+ newlines',
        splitter: /\n{2,}/,
        result: normalizedText.split(/\n{2,}/).filter(p => p.trim())
      }
    ];

    splitInfo.splitMethods = methods.map(method => ({
      name: method.name,
      paragraphCount: method.result.length,
      avgLength: method.result.length > 0 ? Math.round(method.result.reduce((sum, p) => sum + p.length, 0) / method.result.length) : 0,
      sample: method.result.slice(0, 3).map(p => p.substring(0, 100) + (p.length > 100 ? '...' : ''))
    }));

    // Choose the best method (prefer double newline if it produces reasonable results)
    let chosenMethod = methods[0]; // Default to double newline
    
    // If double newline produces very few paragraphs, try single newline
    if (methods[0].result.length < 3 && methods[1].result.length > methods[0].result.length) {
      chosenMethod = methods[1];
    }
    
    // If we get too many tiny paragraphs with single newline, go back to double
    if (chosenMethod.result.length > 50 && chosenMethod.result.some(p => p.length < 20)) {
      chosenMethod = methods[0];
    }

    splitInfo.chosenMethod = chosenMethod.name;
    
    return {
      paragraphs: chosenMethod.result,
      splitInfo
    };
  }, []);

  /**
   * PARAGRAPH PROCESSING FUNCTION
   * 
   * This function processes a paragraph found during search to restructure it
   * based on the presence of "|" characters and the search term.
   * 
   * Logic Flow (corrected workflow):
   * 1. Check if paragraph contains "|" and has at least 3 parts when split (2+ "|" chars)
   * 2. If yes:
   *    - Split paragraph by "|" into sentences
   *    - Keep the first sentence as base
   *    - For each remaining sentence, check if it contains the search term
   *    - Only include sentences that contain the search term
   *    - Join the first sentence with selected sentences using spaces
   * 3. If no: return original paragraph unchanged
   * 
   * Example:
   * Input: "Introduction | This contains searchterm | This doesn't | Another searchterm here"
   * Search: "searchterm"
   * Output: "Introduction This contains searchterm Another searchterm here"
   */
  const processFoundParagraph = useCallback((paragraph: string, searchTerm: string, fileName: string, paragraphIndex: number): { processed: string; debug: any } => {
    // Normalize search term for comparison (lowercase, trimmed)
    const processedSearchTerm = searchTerm.trim().toLowerCase();
    
    const debugData = {
      fileName,
      paragraphIndex,
      originalParagraph: paragraph,
      searchTerm: processedSearchTerm,
      containsPipe: paragraph.includes('|'),
      splitCount: paragraph.split('|').length,
      sentences: [] as string[],
      selectedSentences: [] as string[],
      finalParagraph: ''
    };
    
    // Check if paragraph contains "|" and has at least 2 occurrences (meaning 3+ parts when split)
    // This matches the corrected workflow: split using "|" character
    if (paragraph.includes('|') && paragraph.split('|').length >= 3) {
      // Split paragraph into sentences using "|" as delimiter
      const sentences = paragraph.split('|').map(s => s.trim());
      debugData.sentences = sentences;
      
      // Start with the first sentence (always included as base)
      const finalParagraphParts = [sentences[0]];
      debugData.selectedSentences.push(`[BASE] ${sentences[0]}`);

      // Check each sentence (starting from the second) for the presence of the search term
      for (let i = 1; i < sentences.length; i++) {
        const sentence = sentences[i];
        const containsTerm = sentence.toLowerCase().includes(processedSearchTerm);
        
        // If this sentence contains the search term (case-insensitive), include it
        if (containsTerm) {
          finalParagraphParts.push(sentence);
          debugData.selectedSentences.push(`[MATCH] ${sentence}`);
        } else {
          debugData.selectedSentences.push(`[SKIP] ${sentence}`);
        }
      }

      // Join the first sentence with all selected sentences using spaces
      const result = finalParagraphParts.join(' ');
      debugData.finalParagraph = result;
      return { processed: result, debug: debugData };
    }
    
    // If there aren't at least two "|" characters, return the original paragraph unchanged
    debugData.finalParagraph = paragraph;
    return { processed: paragraph, debug: debugData };
  }, []);

  /**
   * MAIN SEARCH FUNCTION
   * 
   * This function performs the core search operation across selected files.
   * It implements the exact same logic as the original Python version.
   * 
   * Workflow:
   * 1. Split original text in paragraphs using \n\n (with enhanced splitting logic)
   * 2. Look for those paragraphs that contains the search term
   * 3. Only in those selected paragraphs, split them using the character "|", to form a new list of sentences
   * 4. Mount the final response paragraph item by joining the first sentence of this new list along with those sentences that actually contains the search term
   */
  const handleSearch = useCallback(async (term: string, selectedFileIds: string[]) => {
    // Input validation: ensure we have both search term and selected files
    if (!term.trim() || selectedFileIds.length === 0) return;

    // Set loading state and store search term for UI
    setIsSearching(true);
    setSearchTerm(term);

    try {
      const results: SearchResult[] = [];
      const allDebugInfo: DebugInfo[] = [];
      // Normalize search term for consistent comparison
      const processedTerm = term.trim().toLowerCase();

      // Process each selected file
      for (const fileId of selectedFileIds) {
        // Find the file data by ID
        const file = files.find(f => f.id === fileId);
        if (!file) continue; // Skip if file not found

        // STEP 1: Split content into paragraphs using enhanced splitting logic
        const { paragraphs: allParagraphs, splitInfo } = splitTextIntoParagraphs(file.content);
        
        // Add file-level debug info
        allDebugInfo.push({
          fileName: file.name,
          paragraphIndex: 0,
          originalParagraph: `FILE SPLIT INFO: ${JSON.stringify(splitInfo, null, 2)}`,
          processedParagraph: `Total paragraphs found: ${allParagraphs.length}`,
          debugDetails: {
            fileName: file.name,
            paragraphIndex: 0,
            originalParagraph: file.content.substring(0, 500) + (file.content.length > 500 ? '...' : ''),
            searchTerm: processedTerm,
            containsPipe: false,
            splitCount: 0,
            sentences: [],
            selectedSentences: [`Split method: ${splitInfo.chosenMethod}`, `Paragraphs found: ${allParagraphs.length}`],
            finalParagraph: `File processing complete`,
            splitInfo
          }
        });
        
        // Initialize containers for this file's results
        const foundParagraphs: string[] = [];
        let occurrenceCount = 0;

        // STEP 2: CRITICAL FILTERING - Only process paragraphs that contain the search term
        for (let i = 0; i < allParagraphs.length; i++) {
          const paragraph = allParagraphs[i];
          
          // Check if this paragraph contains the search term (case-insensitive)
          const containsSearchTerm = paragraph.toLowerCase().includes(processedTerm);
          
          if (containsSearchTerm) {
            // STEP 3 & 4: Process the found paragraph using the pipe-handling logic
            const { processed, debug } = processFoundParagraph(paragraph, term, file.name, i + 1);
            foundParagraphs.push(processed);
            
            // Add debug info
            allDebugInfo.push({
              fileName: file.name,
              paragraphIndex: i + 1,
              originalParagraph: paragraph,
              processedParagraph: processed,
              debugDetails: { ...debug, splitInfo: undefined }
            });
            
            // Count occurrences in the ORIGINAL paragraph (before processing)
            const matches = paragraph.toLowerCase().match(new RegExp(processedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'));
            const paragraphOccurrences = matches ? matches.length : 0;
            occurrenceCount += paragraphOccurrences;
          }
        }

        // Store results for this file with complete statistics
        results.push({
          fileName: file.name,
          foundParagraphs,           // Only paragraphs containing the search term (processed)
          totalParagraphs: allParagraphs.length,
          occurrenceCount            // Total occurrences across all found paragraphs
        });
      }
      
      // Update UI with search results and debug info
      setSearchResults(results);
      setDebugInfo(allDebugInfo);
    } finally {
      // Always clear loading state, even if search fails
      setIsSearching(false);
    }
  }, [files, processFoundParagraph, splitTextIntoParagraphs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">LS</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Lexical Search</h1>
                <p className="text-slate-600 text-sm">Find and organize text across your documents</p>
              </div>
            </div>
            
            {/* Debug Toggle Button */}
            {debugInfo.length > 0 && (
              <button
                onClick={() => setShowDebug(!showDebug)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  showDebug 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {showDebug ? 'Hide Debug' : 'Show Debug'}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`grid gap-8 ${showDebug ? 'grid-cols-1 xl:grid-cols-4' : 'grid-cols-1 lg:grid-cols-3'}`}>
          {/* Left Sidebar */}
          <div className={`space-y-6 ${showDebug ? 'xl:col-span-1' : 'lg:col-span-1'}`}>
            {/* File Source Toggle */}
            <FileSourceToggle 
              mode={fileSourceMode}
              onModeChange={handleModeChange}
            />
            
            {/* File Management */}
            {fileSourceMode === 'upload' ? (
              <FileUpload onFilesUploaded={handleFilesUploaded} />
            ) : (
              <DataFolderSelector onFilesSelected={handleFilesSelected} />
            )}
            
            <SearchForm 
              files={files}
              onSearch={handleSearch}
              isSearching={isSearching}
            />
            {searchResults.length > 0 && (
              <ExportPanel 
                searchResults={searchResults}
                searchTerm={searchTerm}
              />
            )}
          </div>

          {/* Main Content */}
          <div className={`${showDebug ? 'xl:col-span-2' : 'lg:col-span-2'}`}>
            <SearchResults 
              results={searchResults}
              searchTerm={searchTerm}
              isSearching={isSearching}
            />
          </div>

          {/* Debug Panel */}
          {showDebug && (
            <div className="xl:col-span-1">
              <DebugPanel 
                debugInfo={debugInfo}
                searchTerm={searchTerm}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;