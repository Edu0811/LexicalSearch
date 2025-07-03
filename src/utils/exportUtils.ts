import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import { SearchResult } from '../types';

// Markdown parsing utilities
interface MarkdownElement {
  type: 'text' | 'bold' | 'italic' | 'code' | 'header';
  content: string;
  level?: number; // for headers
}

const parseMarkdown = (text: string): MarkdownElement[] => {
  const elements: MarkdownElement[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    // Check for headers (# ## ###) - only at start of line
    if (text[currentIndex] === '#' && (currentIndex === 0 || text[currentIndex - 1] === '\n')) {
      const headerMatch = text.slice(currentIndex).match(/^(#{1,6})\s+(.+?)(?=\n|$)/);
      if (headerMatch) {
        elements.push({
          type: 'header',
          content: headerMatch[2],
          level: headerMatch[1].length
        });
        currentIndex += headerMatch[0].length;
        continue;
      }
    }

    // Check for bold (**text**) - must be complete match
    if (text.slice(currentIndex, currentIndex + 2) === '**') {
      const remainingText = text.slice(currentIndex + 2);
      const endIndex = remainingText.indexOf('**');
      if (endIndex !== -1 && endIndex > 0) {
        const boldContent = remainingText.slice(0, endIndex);
        elements.push({
          type: 'bold',
          content: boldContent
        });
        currentIndex += 4 + boldContent.length; // 2 for opening ** + content + 2 for closing **
        continue;
      }
    }

    // Check for italic (*text*) - must be complete match and not part of **
    if (text[currentIndex] === '*' && 
        text[currentIndex + 1] !== '*' && 
        (currentIndex === 0 || text[currentIndex - 1] !== '*')) {
      const remainingText = text.slice(currentIndex + 1);
      const endIndex = remainingText.indexOf('*');
      if (endIndex !== -1 && endIndex > 0) {
        const italicContent = remainingText.slice(0, endIndex);
        // Make sure the closing * is not part of **
        if (currentIndex + 2 + endIndex >= text.length || text[currentIndex + 2 + endIndex] !== '*') {
          elements.push({
            type: 'italic',
            content: italicContent
          });
          currentIndex += 2 + italicContent.length; // 1 for opening * + content + 1 for closing *
          continue;
        }
      }
    }

    // Check for code (`text`) - must be complete match
    if (text[currentIndex] === '`') {
      const remainingText = text.slice(currentIndex + 1);
      const endIndex = remainingText.indexOf('`');
      if (endIndex !== -1 && endIndex > 0) {
        const codeContent = remainingText.slice(0, endIndex);
        elements.push({
          type: 'code',
          content: codeContent
        });
        currentIndex += 2 + codeContent.length; // 1 for opening ` + content + 1 for closing `
        continue;
      }
    }

    // Regular text - find the next markdown element or end of string
    let nextMarkdownIndex = text.length;
    
    // Look for the next potential markdown start
    for (let i = currentIndex + 1; i < text.length; i++) {
      const char = text[i];
      const prevChar = i > 0 ? text[i - 1] : '';
      
      // Check for potential markdown starts
      if (char === '*' || char === '`' || (char === '#' && prevChar === '\n')) {
        nextMarkdownIndex = i;
        break;
      }
    }

    const textContent = text.slice(currentIndex, nextMarkdownIndex);
    if (textContent) {
      elements.push({
        type: 'text',
        content: textContent
      });
    }
    currentIndex = nextMarkdownIndex;
  }

  return elements;
};

const createDocxTextRuns = (elements: MarkdownElement[]): TextRun[] => {
  return elements.map(element => {
    switch (element.type) {
      case 'bold':
        return new TextRun({ text: element.content, bold: true });
      case 'italic':
        return new TextRun({ text: element.content, italics: true });
      case 'code':
        return new TextRun({ 
          text: element.content, 
          font: 'Courier New',
          shading: { fill: 'F5F5F5' }
        });
      case 'header':
        return new TextRun({ text: element.content, bold: true, size: 28 - (element.level || 1) * 2 });
      default:
        return new TextRun({ text: element.content });
    }
  });
};

export const exportToDocx = async (results: SearchResult[], searchTerm: string): Promise<void> => {
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      text: `Search Results for "${searchTerm}"`,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  );

  // Summary statistics
  const totalParagraphs = results.reduce((sum, result) => sum + result.foundParagraphs.length, 0);
  const totalOccurrences = results.reduce((sum, result) => sum + result.occurrenceCount, 0);

  children.push(
    new Paragraph({
      text: 'Search Summary',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Files searched: `, bold: true }),
        new TextRun({ text: results.length.toString() })
      ],
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Total paragraphs found: `, bold: true }),
        new TextRun({ text: totalParagraphs.toString() })
      ],
      spacing: { after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Total occurrences: `, bold: true }),
        new TextRun({ text: totalOccurrences.toString() })
      ],
      spacing: { after: 400 }
    })
  );

  // Results by file
  for (const result of results) {
    children.push(
      new Paragraph({
        text: `Source: ${result.fileName}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 600, after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Found paragraphs: `, bold: true }),
          new TextRun({ text: result.foundParagraphs.length.toString() }),
          new TextRun({ text: ` of ${result.totalParagraphs} total paragraphs` })
        ],
        spacing: { after: 300 }
      })
    );

    if (result.foundParagraphs.length === 0) {
      children.push(
        new Paragraph({
          text: 'No paragraphs found with the search term.',
          italics: true,
          spacing: { after: 300 }
        })
      );
    } else {
      result.foundParagraphs.forEach((paragraph, index) => {
        // Parse markdown and create formatted text runs
        const elements = parseMarkdown(paragraph.trim());
        const textRuns = createDocxTextRuns(elements);
        
        // Add paragraph number as first text run
        const paragraphRuns = [
          new TextRun({ text: `${index + 1}. `, bold: true }),
          ...textRuns
        ];

        children.push(
          new Paragraph({
            children: paragraphRuns,
            spacing: { after: 200 }
          })
        );
      });
    }

    // Page break after each file (except the last one)
    if (results.indexOf(result) < results.length - 1) {
      children.push(
        new Paragraph({
          text: '',
          pageBreakBefore: true
        })
      );
    }
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children
    }]
  });

  const blob = await Packer.toBlob(doc);
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  saveAs(blob, `lexical-search-results-${timestamp}.docx`);
};

export const exportToPdf = async (results: SearchResult[], searchTerm: string): Promise<void> => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  let yPosition = 30;

  // Enhanced function to add formatted text with proper markdown support
  const addFormattedText = (text: string, fontSize: number = 11, indent: number = 0) => {
    const elements = parseMarkdown(text);
    const lineHeight = fontSize * 0.6;
    let currentLine: Array<{text: string, isBold: boolean, isItalic: boolean, isCode: boolean}> = [];
    let currentLineWidth = 0;
    
    pdf.setFontSize(fontSize);
    
    const flushLine = () => {
      if (currentLine.length === 0) return;
      
      if (yPosition > pdf.internal.pageSize.getHeight() - 20) {
        pdf.addPage();
        yPosition = 30;
      }
      
      let xPosition = margin + indent;
      
      // Render each formatted segment on the current line
      currentLine.forEach(segment => {
        // Set font style based on formatting
        let fontStyle = 'normal';
        if (segment.isBold && segment.isItalic) {
          fontStyle = 'bolditalic';
        } else if (segment.isBold) {
          fontStyle = 'bold';
        } else if (segment.isItalic) {
          fontStyle = 'italic';
        }
        
        pdf.setFont('helvetica', fontStyle);
        
        // For code, use a monospace font
        if (segment.isCode) {
          pdf.setFont('courier', 'normal');
        }
        
        pdf.text(segment.text, xPosition, yPosition);
        xPosition += pdf.getTextWidth(segment.text);
        
        // Reset to normal font after code
        if (segment.isCode) {
          pdf.setFont('helvetica', 'normal');
        }
      });
      
      yPosition += lineHeight;
      currentLine = [];
      currentLineWidth = 0;
    };
    
    const addToLine = (text: string, isBold: boolean = false, isItalic: boolean = false, isCode: boolean = false) => {
      const words = text.split(/\s+/).filter(word => word.length > 0);
      
      words.forEach((word, index) => {
        // Add space before word (except first word in line)
        const wordWithSpace = (currentLine.length > 0 || index > 0) ? ' ' + word : word;
        
        // Set font for width calculation
        let fontStyle = 'normal';
        if (isBold && isItalic) {
          fontStyle = 'bolditalic';
        } else if (isBold) {
          fontStyle = 'bold';
        } else if (isItalic) {
          fontStyle = 'italic';
        }
        
        pdf.setFont(isCode ? 'courier' : 'helvetica', fontStyle);
        const wordWidth = pdf.getTextWidth(wordWithSpace);
        
        // Check if adding this word would exceed line width
        if (currentLineWidth + wordWidth > maxWidth - indent && currentLine.length > 0) {
          flushLine();
          // Start new line with this word (without leading space)
          currentLine.push({text: word, isBold, isItalic, isCode});
          currentLineWidth = pdf.getTextWidth(word);
        } else {
          currentLine.push({text: wordWithSpace, isBold, isItalic, isCode});
          currentLineWidth += wordWidth;
        }
      });
    };
    
    // Process each markdown element
    elements.forEach(element => {
      switch (element.type) {
        case 'bold':
          addToLine(element.content, true, false, false);
          break;
        case 'italic':
          addToLine(element.content, false, true, false);
          break;
        case 'code':
          addToLine(element.content, false, false, true);
          break;
        case 'header':
          // Flush current line before header
          flushLine();
          addToLine(element.content, true, false, false);
          flushLine();
          yPosition += 5; // Extra space after header
          break;
        default:
          addToLine(element.content, false, false, false);
          break;
      }
    });
    
    // Flush any remaining content
    flushLine();
    yPosition += 5; // Extra spacing after paragraph
  };

  // Helper function for simple text (backwards compatibility)
  const addWrappedText = (text: string, fontSize: number = 11, isBold: boolean = false, indent: number = 0) => {
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    
    const lines = pdf.splitTextToSize(text, maxWidth - indent);
    
    for (const line of lines) {
      if (yPosition > pdf.internal.pageSize.getHeight() - 20) {
        pdf.addPage();
        yPosition = 30;
      }
      
      pdf.text(line, margin + indent, yPosition);
      yPosition += fontSize * 0.6;
    }
    
    yPosition += 5;
  };

  // Title
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Search Results for "${searchTerm}"`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 30;

  // Summary
  const totalParagraphs = results.reduce((sum, result) => sum + result.foundParagraphs.length, 0);
  const totalOccurrences = results.reduce((sum, result) => sum + result.occurrenceCount, 0);

  addWrappedText('Search Summary', 14, true);
  addWrappedText(`Files searched: ${results.length}`);
  addWrappedText(`Total paragraphs found: ${totalParagraphs}`);
  addWrappedText(`Total occurrences: ${totalOccurrences}`);
  yPosition += 10;

  // Results by file
  for (const result of results) {
    if (yPosition > pdf.internal.pageSize.getHeight() - 60) {
      pdf.addPage();
      yPosition = 30;
    }

    addWrappedText(`Source: ${result.fileName}`, 14, true);
    addWrappedText(`Found paragraphs: ${result.foundParagraphs.length} of ${result.totalParagraphs} total`);
    yPosition += 5;

    if (result.foundParagraphs.length === 0) {
      addWrappedText('No paragraphs found with the search term.', 11, false, 10);
    } else {
      result.foundParagraphs.forEach((paragraph, index) => {
        if (yPosition > pdf.internal.pageSize.getHeight() - 40) {
          pdf.addPage();
          yPosition = 30;
        }
        
        // Add paragraph number with bold formatting
        addWrappedText(`${index + 1}. `, 10, true, 10);
        yPosition -= 10; // Adjust to put content on same line as number
        
        // Add formatted paragraph content with full markdown support
        addFormattedText(paragraph.trim(), 10, 20);
      });
    }

    yPosition += 15; // Extra space between files
  }

  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  pdf.save(`lexical-search-results-${timestamp}.pdf`);
};