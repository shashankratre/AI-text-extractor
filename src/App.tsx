
import React, { useState, useCallback, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import jsPDF from 'jspdf';
import { noto_sans_devanagari_regular_base64 } from './fonts';

// Use a reliable CDN for the worker to simplify deployment
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// --- TYPE DEFINITIONS ---
type AppState = 'idle' | 'processing' | 'success' | 'error';
type Progress = {
  message: string;
  percentage: number;
};

// --- GEMINI PROMPT ---
const EXTRACTION_PROMPT = `You are an advanced OCR-driven text extraction system. Your task is to extract clean, accurate, and structured text from the following page images from a scanned PDF document that contains questions written in both Hindi and English. Follow these instructions carefully: 1. OCR & Language Handling: Detect and read text from the scanned (image-based) PDF pages. Automatically identify Hindi (Devanagari script) and English text. Extract both languages accurately. Preserve the original order of questions and content as it appears on the page. 2. Output Format: Produce a single, clean block of text. Use Markdown for bolding. 3. Cleaning & Accuracy Requirements: Remove digital noise, watermarks, and artifacts from crooked scans. Correct common OCR mistakes (e.g., misread characters in Devanagari or English). Ensure question numbers and any sub-numbering (a, b, c, i, ii, iii) remain intact and are correctly associated with their questions. **Bold only the question statements.** Do not bold the options (e.g., (A), (B), (C), (D)). Do NOT translate any text; extract it exactly as it is written in its original language. 4. Special Requirements: Maintain line breaks and paragraph structure as in the original document to separate questions and options clearly. If any part of the text is completely unreadable or illegible, mark it as: [Unclear Text]. Do not merge Hindi and English questions into one, even if they are parallel translations of each other on the page. List them sequentially as they appear. 5. Final Output: Provide the output as structured, machine-readable, and cleanly formatted text, ready for use in a question-paper analyzer system. Begin extraction now from the provided images.`;

// --- SVG ICON COMPONENTS ---
const UploadIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-10 w-10 text-slate-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg> );
const CopyIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg> );
const ResetIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M3 2v6h6" /><path d="M21 12A9 9 0 0 0 6 5.3L3 8" /><path d="M21 22v-6h-6" /><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7" /></svg> );
const DownloadIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg> );
const SpinnerIcon = () => ( <svg aria-hidden="true" className="w-5 h-5 animate-spin text-white" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#475569"/><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/></svg> );

export default function App() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => { setAppState('idle'); setProgress(null); setError(null); setExtractedText(''); setFileName(''); setIsCopied(false); setIsDownloading(false); if (fileInputRef.current) { fileInputRef.current.value = ''; } };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) { processFile(file); } };
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation(); event.currentTarget.classList.remove('border-blue-500', 'bg-slate-800/50'); const file = event.dataTransfer.files?.[0]; if (file) { processFile(file); } };
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation(); event.currentTarget.classList.add('border-blue-500', 'bg-slate-800/50'); };
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation(); event.currentTarget.classList.remove('border-blue-500', 'bg-slate-800/50'); };

  const processFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') { setError('Invalid file type. Please upload a PDF file.'); setAppState('error'); return; }
    setAppState('processing'); setError(null); setFileName(file.name);
    try {
      setProgress({ message: 'Reading PDF file...', percentage: 5 });
      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file);
      fileReader.onload = async (e) => {
        try {
          const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          const imageParts: { inlineData: { data: string; mimeType: string } }[] = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            setProgress({ message: `Converting page ${i} of ${pdf.numPages} to image...`, percentage: 10 + (70 * i) / pdf.numPages, });
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height; canvas.width = viewport.width;
            if (context) {
              await page.render({ canvasContext: context, viewport: viewport }).promise;
              const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
              imageParts.push({ inlineData: { data: base64Image, mimeType: 'image/jpeg', }, });
            }
          }
          
          // Call our secure backend endpoint instead of Google directly
          setProgress({ message: 'Extracting text with Gemini AI...', percentage: 85 });
          const apiResponse = await fetch('/api/extract', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageParts: imageParts, prompt: EXTRACTION_PROMPT }),
          });
          if (!apiResponse.ok) { throw new Error(`API request failed: ${await apiResponse.text()}`); }
          const result = await apiResponse.json();
          
          setProgress({ message: 'Finalizing result...', percentage: 95 });
          setExtractedText(result.text);
          setAppState('success');
        } catch (err) {
          console.error(err);
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during processing.';
          setError(`Failed to process PDF: ${errorMessage}`);
          setAppState('error');
        } finally {
          setProgress(null);
        }
      };
      fileReader.onerror = () => { setError('Failed to read the PDF file.'); setAppState('error'); };
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`An unexpected error occurred: ${errorMessage}`);
      setAppState('error');
    }
  }, []);

  const handleCopy = () => { if (extractedText) { navigator.clipboard.writeText(extractedText).then(() => { setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); }); } };
  const handleDownloadPdf = async () => {
    if (!extractedText) return;
    setIsDownloading(true);
    try {
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.addFileToVFS('NotoSansDevanagari-Regular.ttf', noto_sans_devanagari_regular_base64);
        pdf.addFont('NotoSansDevanagari-Regular.ttf', 'NotoSansDevanagari', 'normal');
        pdf.addFont('NotoSansDevanagari-Regular.ttf', 'NotoSansDevanagari', 'bold');
        pdf.setFont('NotoSansDevanagari');
        pdf.setFontSize(12);
        const pageHeight = pdf.internal.pageSize.getHeight(); const pageWidth = pdf.internal.pageSize.getWidth(); const margin = 15; const maxLineWidth = pageWidth - margin * 2; const lineHeight = 7; let cursorY = margin;
        const allLines = extractedText.split('\n');
        allLines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine === '') { cursorY += lineHeight; if (cursorY > pageHeight - margin) { pdf.addPage(); cursorY = margin; } return; }
            const isBold = trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && trimmedLine.length > 4;
            const textToRender = isBold ? trimmedLine.substring(2, trimmedLine.length - 2) : trimmedLine;
            pdf.setFont(undefined, isBold ? 'bold' : 'normal');
            const wrappedLines = pdf.splitTextToSize(textToRender, maxLineWidth);
            wrappedLines.forEach((wrappedLine: string) => {
                if (cursorY + lineHeight > pageHeight - margin) { pdf.addPage(); cursorY = margin; }
                pdf.text(wrappedLine, margin, cursorY);
                cursorY += lineHeight;
            });
        });
        pdf.save(`${fileName.replace(/\.pdf$/i, '')}-extracted.pdf`);
    } catch (e) { console.error("Error generating PDF:", e); setError("Failed to generate PDF. Please ensure your browser is up to date.");
    } finally { setIsDownloading(false); }
  };

  const renderContent = () => {
    switch (appState) {
      case 'processing': return ( <div className="text-center"><div className="relative w-24 h-24 mx-auto mb-4"><div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div><div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-spin" style={{ clipPath: `inset(0 ${100 - (progress?.percentage ?? 0)}% 0 0)` }}></div><div className="absolute inset-0 flex items-center justify-center text-lg font-semibold text-slate-300">{Math.round(progress?.percentage ?? 0)}%</div></div><p className="text-slate-400 animate-pulse">{progress?.message}</p><p className="mt-2 text-sm text-slate-500 break-all">{fileName}</p></div> );
      case 'success': return ( <div className="w-full max-w-4xl mx-auto"><div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4"><p className="text-sm text-slate-400 font-medium truncate">Extracted text from: <span className="text-slate-300">{fileName}</span></p><div className="flex gap-2 flex-shrink-0"><button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 transition-colors text-sm font-semibold"><CopyIcon />{isCopied ? 'Copied!' : 'Copy Text'}</button><button onClick={handleDownloadPdf} disabled={isDownloading} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-green-500 transition-colors text-sm font-semibold disabled:bg-green-800 disabled:cursor-not-allowed">{isDownloading ? <SpinnerIcon /> : <DownloadIcon />}{isDownloading ? 'Downloading...' : 'Download PDF'}</button><button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-200 rounded-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-slate-500 transition-colors text-sm font-semibold"><ResetIcon />Start Over</button></div></div><div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 max-h-[60vh] overflow-y-auto"><pre className="text-slate-300 whitespace-pre-wrap text-sm sm:text-base"><code>{extractedText}</code></pre></div></div> );
      case 'error': return ( <div className="text-center bg-red-900/20 border border-red-500/30 rounded-lg p-8 max-w-lg mx-auto"><h3 className="text-xl font-semibold text-red-400 mb-2">Extraction Failed</h3><p className="text-red-300/80 mb-6">{error}</p><button onClick={handleReset} className="flex items-center justify-center mx-auto gap-2 px-6 py-2 bg-slate-700 text-slate-200 rounded-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-slate-500 transition-colors font-semibold"><ResetIcon />Try Again</button></div> );
      default: return ( <div onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave} className="relative w-full max-w-lg mx-auto p-8 border-2 border-dashed border-slate-600 rounded-xl text-center cursor-pointer hover:border-blue-500 hover:bg-slate-800/50 transition-all duration-300" onClick={() => fileInputRef.current?.click()}><div className="flex flex-col items-center justify-center space-y-4"><UploadIcon /><p className="text-lg font-semibold text-slate-300">Drop your PDF here or <span className="text-blue-400">browse</span></p><p className="text-sm text-slate-500">Supports scanned Hindi & English question papers</p></div><input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" aria-label="File uploader" /></div> );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight">Scanned PDF Text Extractor</h1>
        <p className="mt-2 text-base text-slate-400 max-w-2xl mx-auto">AI-powered OCR to extract and structure text from PDFs with Hindi and English questions.</p>
      </header>
      <main className="w-full flex-grow flex items-center justify-center">
        {renderContent()}
      </main>
      <footer className="text-center mt-10 text-sm text-slate-500">
        <p>Powered by React, Tailwind CSS, and Google Gemini</p>
      </footer>
    </div>
  );
}
