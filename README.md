# Lexical Search Application

A modern web-based text search tool that allows users to upload documents, search for specific terms, and export results. This application is a React/TypeScript implementation of the original Python Streamlit version, designed for deployment on Netlify.

## 🔍 Overview

Lexical Search helps users find and organize text content across multiple documents. It provides advanced paragraph filtering, special handling for pipe-delimited content, and comprehensive export capabilities.

## 🚀 Features

- **File Upload**: Support for text and markdown files (up to 10MB each)
- **Advanced Search**: Case-insensitive search with intelligent paragraph filtering
- **Pipe Processing**: Special handling for pipe-delimited content sections
- **Export Options**: Generate DOCX and PDF reports with search results
- **Responsive Design**: Modern, professional interface that works on all devices
- **Real-time Statistics**: Live counts of files, paragraphs, and occurrences

## 📋 Program Logic Flow

### 1. File Upload Process
```
User selects files → FileUpload component validates files → 
Files stored in application state → Available for search
```

**File Validation:**
- File type: `.txt`, `.md`, or `text/*` MIME types
- Size limit: 10MB per file
- Encoding: UTF-8 with fallback handling

### 2. Search Configuration
```
User enters search term → Selects files to search → 
Validates inputs → Triggers search process
```

**Input Requirements:**
- Non-empty search term (trimmed)
- At least one file selected
- Files must be successfully uploaded

### 3. Core Search Algorithm

The search process follows this detailed workflow:

#### Step 1: Input Preparation
```typescript
// Normalize search term for consistent comparison
const processedTerm = term.trim().toLowerCase();
```

#### Step 2: File Processing Loop
```
For each selected file:
  ├── Split content into paragraphs (using '\n\n' delimiter)
  ├── Filter empty paragraphs
  └── Process each paragraph
```

#### Step 3: Paragraph Filtering (CRITICAL)
```typescript
// Only process paragraphs that contain the search term
for (const paragraph of allParagraphs) {
  if (paragraph.toLowerCase().includes(processedTerm)) {
    // Process this paragraph
  }
  // Skip paragraphs without the search term
}
```

#### Step 4: Paragraph Processing Logic
```
If paragraph contains 2+ "|" characters:
  ├── Split by "|" into sub-sections
  ├── Keep first sub-section as base
  ├── For each remaining sub-section:
  │   └── Include only if it contains search term
  └── Join selected sections with spaces
Else:
  └── Return original paragraph unchanged
```

#### Step 5: Statistics Collection
```typescript
// Count occurrences in ORIGINAL paragraph (before processing)
const matches = paragraph.toLowerCase().match(regex);
occurrenceCount += matches ? matches.length : 0;
```

### 4. Results Display

The search results are organized hierarchically:

```
Search Summary (aggregate statistics)
├── Total files searched
├── Total paragraphs found
└── Total term occurrences

For each file:
├── File name and statistics
├── Expandable paragraph list
└── Markdown-rendered content with highlighting
```

### 5. Export Process

#### DOCX Export Flow:
```
Search Results → Generate Document Structure → 
Create DOCX with docx library → Download file
```

#### PDF Export Flow:
```
Search Results → Format text content → 
Generate PDF with jsPDF → Download file
```

## 🔧 Technical Architecture

### Component Structure
```
App (main container)
├── FileUpload (file management)
├── SearchForm (search configuration)
├── SearchResults (results display)
└── ExportPanel (export functionality)
```

### Key Functions

#### `processFoundParagraph(paragraph, searchTerm)`
**Purpose**: Restructures paragraphs with pipe-delimited content
**Logic**: 
- Checks for 2+ "|" characters
- Splits content into sections
- Filters sections containing search term
- Reconstructs paragraph with relevant sections only

#### `handleSearch(term, selectedFileIds)`
**Purpose**: Main search orchestration function
**Logic**:
1. Input validation
2. File content processing
3. Paragraph filtering and processing
4. Statistics calculation
5. Results compilation

#### `highlightSearchTerm(text, term)`
**Purpose**: Adds markdown highlighting to search terms
**Logic**: Uses regex replacement to wrap terms in `**bold**` markdown

### Data Flow

```
User Input → State Management → Search Processing → 
Results Generation → UI Update → Export Options
```

### State Management
- `files`: Array of uploaded file data
- `searchResults`: Array of search results per file
- `searchTerm`: Current search term
- `isSearching`: Loading state indicator

## 🛠 Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
npm run dev
```

### Dependencies
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Lucide React**: Icons
- **react-markdown**: Markdown rendering
- **docx**: DOCX generation
- **jspdf**: PDF generation
- **file-saver**: File download handling

## 📁 File Structure

```
src/
├── components/
│   ├── FileUpload.tsx      # File upload and management
│   ├── SearchForm.tsx      # Search configuration
│   ├── SearchResults.tsx   # Results display
│   └── ExportPanel.tsx     # Export functionality
├── types/
│   └── index.ts           # TypeScript interfaces
├── utils/
│   └── exportUtils.ts     # Export utility functions
├── App.tsx                # Main application component
└── main.tsx              # Application entry point
```

## 🔄 Workflow Summary

1. **Upload**: User uploads text/markdown files
2. **Configure**: User enters search term and selects files
3. **Search**: Application processes files and filters paragraphs
4. **Display**: Results shown with statistics and highlighting
5. **Export**: User can generate DOCX/PDF reports
6. **Download**: Formatted documents downloaded to user's device

## 🎯 Key Differences from Python Version

- **Web-based**: Runs in browser instead of desktop
- **Real-time**: Immediate feedback and responsive UI
- **Modern Export**: Client-side document generation
- **Enhanced Display**: Markdown rendering with syntax highlighting
- **Responsive Design**: Works on mobile and desktop
- **No External Dependencies**: No Pandoc or Word macros required

## 🚀 Deployment

The application is designed for deployment on Netlify:

```bash
npm run build
# Deploy dist/ folder to Netlify
```

The build process creates a static site that can be served from any web server or CDN.