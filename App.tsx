
import React, { useState } from 'react';
import { Transaction } from './types';
import { analyzeBankStatement } from './services/geminiService';
import FileUpload from './components/FileUpload';
import TransactionTable from './components/TransactionTable';
import StatsCards from './components/StatsCards';
import SummarySection from './components/SummarySection';

interface StatementAnalysis {
  fileName: string;
  transactions: Transaction[];
}

const App: React.FC = () => {
  const [analyses, setAnalyses] = useState<StatementAnalysis[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const base64 = await convertToBase64(file);
      const data = await analyzeBankStatement(base64);
      
      const newAnalysis: StatementAnalysis = {
        fileName: file.name,
        transactions: data
      };
      
      setAnalyses(prev => [...prev, newAnalysis]);
      setActiveIndex(analyses.length); // Set to the newly added one
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred while processing the statement.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeAnalysis = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newAnalyses = analyses.filter((_, i) => i !== index);
    setAnalyses(newAnalyses);
    if (newAnalyses.length === 0) {
      setActiveIndex(null);
    } else if (activeIndex === index) {
      setActiveIndex(0);
    } else if (activeIndex !== null && activeIndex > index) {
      setActiveIndex(activeIndex - 1);
    }
  };

  const reset = () => {
    setAnalyses([]);
    setActiveIndex(null);
    setError(null);
  };

  const currentTransactions = activeIndex !== null ? analyses[activeIndex].transactions : [];

  return (
    <div className="min-h-screen pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm backdrop-blur-md bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <i className="fas fa-file-invoice-dollar"></i>
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">StatementInsight <span className="text-blue-600 font-extrabold">AI</span></h1>
          </div>
          
          {analyses.length > 0 && (
            <div className="flex items-center space-x-4">
               <button 
                onClick={() => setActiveIndex(null)}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1"
              >
                <i className="fas fa-plus-circle"></i>
                <span>Add More</span>
              </button>
              <button 
                onClick={reset}
                className="text-sm font-medium text-gray-400 hover:text-red-600 transition-colors flex items-center space-x-1"
              >
                <i className="fas fa-trash-can"></i>
                <span>Reset All</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Intro Section */}
        {analyses.length === 0 && !isLoading && (
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
              Analyze your bank spending in seconds
            </h2>
            <p className="text-lg text-gray-600">
              Upload your image-based bank statement PDF. Our AI will extract all transactions, 
              categorize your spending, and provide a clear overview.
            </p>
          </div>
        )}

        {/* Upload Area - Only shown if activeIndex is null (the 'Add More' state) or no analyses exist */}
        {(analyses.length === 0 || activeIndex === null) && (
          <div className="max-w-3xl mx-auto mb-12">
            <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} />
            
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-3">
                <i className="fas fa-circle-exclamation text-red-500 mt-0.5"></i>
                <div className="text-sm text-red-700 font-medium">{error}</div>
              </div>
            )}
            
            {analyses.length > 0 && activeIndex === null && (
              <button 
                onClick={() => setActiveIndex(0)}
                className="mt-6 w-full py-3 border border-gray-300 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel and back to Analysis
              </button>
            )}
          </div>
        )}

        {/* Results Tabs */}
        {analyses.length > 0 && (
          <div className="animate-in fade-in duration-500">
            <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-6 border-b border-gray-100 no-scrollbar">
              {analyses.map((analysis, idx) => (
                <div 
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-lg cursor-pointer transition-all border-2
                    ${activeIndex === idx 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                      : 'bg-white border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-200'}`}
                >
                  <i className={`fas fa-file-pdf ${activeIndex === idx ? 'text-blue-200' : 'text-gray-400'}`}></i>
                  <span className="text-sm font-semibold truncate max-w-[150px]">{analysis.fileName}</span>
                  <button 
                    onClick={(e) => removeAnalysis(idx, e)}
                    className={`ml-1 p-1 rounded-full transition-colors ${activeIndex === idx ? 'hover:bg-blue-700 text-blue-200' : 'hover:bg-gray-200 text-gray-400'}`}
                  >
                    <i className="fas fa-times text-[10px]"></i>
                  </button>
                </div>
              ))}
            </div>

            {activeIndex !== null && (
              <>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Analysis for {analyses[activeIndex].fileName}</h2>
                    <p className="text-gray-500">Reviewing {currentTransactions.length} transactions.</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm flex items-center space-x-2"
                    >
                      <i className="fas fa-print"></i>
                      <span>Print Report</span>
                    </button>
                  </div>
                </div>

                <StatsCards transactions={currentTransactions} />
                <TransactionTable transactions={currentTransactions} />
                <SummarySection transactions={currentTransactions} />
              </>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 w-full py-4 px-6 bg-white border-t border-gray-100 text-center text-xs text-gray-400 print:hidden">
        &copy; {new Date().getFullYear()} StatementInsight AI. Secure client-side processing.
      </footer>
    </div>
  );
};

export default App;
