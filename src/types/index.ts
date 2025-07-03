export interface FileData {
  id: string;
  name: string;
  content: string;
  size: number;
  type: string;
}

export interface SearchResult {
  fileName: string;
  foundParagraphs: string[];
  totalParagraphs: number;
  occurrenceCount: number;
}

export interface DebugInfo {
  fileName: string;
  paragraphIndex: number;
  originalParagraph: string;
  processedParagraph: string;
  debugDetails: {
    fileName: string;
    paragraphIndex: number;
    originalParagraph: string;
    searchTerm: string;
    containsPipe: boolean;
    splitCount: number;
    sentences: string[];
    selectedSentences: string[];
    finalParagraph: string;
    splitInfo?: {
      originalLength: number;
      normalizedLength: number;
      hasCarriageReturns: boolean;
      hasWindowsLineEndings: boolean;
      doubleNewlineCount: number;
      singleNewlineCount: number;
      chosenMethod: string;
      splitMethods: Array<{
        name: string;
        paragraphCount: number;
        avgLength: number;
        sample: string[];
      }>;
    };
  };
}

export interface DataFolderFile {
  name: string;
  path: string;
  size: number;
  type: string;
}

export type FileSourceMode = 'upload' | 'data-folder';