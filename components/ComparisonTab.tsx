
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '../types';
import { analyzeCategoryComparison } from '../services/geminiService';

interface StatementAnalysis {
  fileName: string;
  transactions: Transaction[];
}

interface ComparisonTabProps {
  analyses: StatementAnalysis[];
}

const ComparisonTab: React.FC<ComparisonTabProps> = ({ analyses }) => {
  const [comments, setComments] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const definedTags = [
    "therapy", "grocery", "taxi", "gas", "laundry", 
    "amenities", "subscription", "massage", "temu", "food", "amazon", "cleaner", "transfers", "vet", "hospital", "rent"
  ];

  const homeLivingTags = ["laundry", "amenities", "grocery", "cleaner"];

  // Sort analyses by date (oldest to latest)
  const sortedAnalyses = [...analyses].sort((a, b) => {
    // Try to find the earliest date in each statement for sorting
    const getEarliestDate = (transactions: Transaction[]) => {
      if (transactions.length === 0) return 0;
      const dates = transactions.map(t => new Date(t.date).getTime()).filter(d => !isNaN(d));
      return dates.length > 0 ? Math.min(...dates) : 0;
    };
    return getEarliestDate(a.transactions) - getEarliestDate(b.transactions);
  });

  // Calculate totals for each tag in each analysis
  const comparisonData = definedTags.map(tag => {
    const rowData = sortedAnalyses.map(analysis => {
      const total = analysis.transactions
        .filter(t => t.type === TransactionType.WITHDRAWAL && t.tag.toLowerCase() === tag.toLowerCase())
        .reduce((sum, t) => sum + t.amount, 0);
      return { fileName: analysis.fileName, amount: total };
    });
    return { tag, dataPoints: rowData };
  });

  // Add Home & Living Total row
  const homeLivingRow = {
    tag: "Home & Living Total",
    isTotal: true,
    dataPoints: sortedAnalyses.map(analysis => {
      const total = analysis.transactions
        .filter(t => t.type === TransactionType.WITHDRAWAL && homeLivingTags.includes(t.tag.toLowerCase()))
        .reduce((sum, t) => sum + t.amount, 0);
      return { fileName: analysis.fileName, amount: total };
    })
  };

  useEffect(() => {
    const fetchComments = async () => {
      if (sortedAnalyses.length < 2) return;
      
      setIsAnalyzing(true);
      const newComments: Record<string, string> = {};
      
      try {
        // Run analysis for each category that has some spending in at least one file
        // Also include the Home & Living row for analysis
        const rowsToAnalyze = [...comparisonData, homeLivingRow]
          .filter(row => row.dataPoints.some(dp => dp.amount > 0));

        const analysisPromises = rowsToAnalyze.map(async (row) => {
          const comment = await analyzeCategoryComparison(row.tag, row.dataPoints);
          return { tag: row.tag, comment };
        });
          
        const results = await Promise.all(analysisPromises);
        results.forEach(res => {
          newComments[res.tag] = res.comment;
        });
        
        setComments(newComments);
      } catch (error) {
        console.error("Error fetching comparison comments:", error);
      } finally {
        setIsAnalyzing(false);
      }
    };

    fetchComments();
  }, [analyses]); // Re-run when the original analyses array changes

  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Multi-Statement Comparison</h3>
            <p className="text-sm text-gray-500">Comparing spending patterns across {sortedAnalyses.length} statements (sorted oldest to latest).</p>
          </div>
          {isAnalyzing && (
            <div className="flex items-center space-x-2 text-blue-600">
              <i className="fas fa-circle-notch fa-spin"></i>
              <span className="text-xs font-bold uppercase tracking-wider">AI Analyzing Trends...</span>
            </div>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest sticky left-0 bg-gray-50 z-10">Category</th>
                {sortedAnalyses.map((analysis, idx) => (
                  <th key={idx} className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider text-right min-w-[120px]">
                    {analysis.fileName}
                  </th>
                ))}
                <th className="px-6 py-4 text-xs font-bold text-blue-600 uppercase tracking-widest min-w-[250px]">AI Insight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Regular Categories */}
              {comparisonData.map((row) => {
                const hasSpending = row.dataPoints.some(dp => dp.amount > 0);
                if (!hasSpending) return null;

                return (
                  <tr key={row.tag} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 sticky left-0 bg-white z-10 border-r border-gray-50">
                      <span className="text-sm font-bold text-gray-800 capitalize">{row.tag}</span>
                    </td>
                    {row.dataPoints.map((dp, idx) => (
                      <td key={idx} className="px-6 py-4 text-sm text-right font-medium text-gray-700">
                        ${dp.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    ))}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 italic bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                        {comments[row.tag] || (isAnalyzing ? "..." : "No analysis yet.")}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Home & Living Total Row */}
              {homeLivingRow.dataPoints.some(dp => dp.amount > 0) && (
                <tr className="bg-blue-600/5 border-t-2 border-blue-200">
                  <td className="px-6 py-4 sticky left-0 bg-blue-50 z-10 border-r border-blue-100">
                    <div className="flex items-center space-x-2">
                      <i className="fas fa-house-user text-blue-600 text-xs"></i>
                      <span className="text-sm font-black text-blue-900 uppercase tracking-tight">Home & Living</span>
                    </div>
                  </td>
                  {homeLivingRow.dataPoints.map((dp, idx) => (
                    <td key={idx} className="px-6 py-4 text-sm text-right font-black text-blue-700">
                      ${dp.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  ))}
                  <td className="px-6 py-4">
                    <div className="text-sm text-blue-800 font-bold italic bg-blue-100/50 p-2 rounded-lg border border-blue-200/50">
                      {comments[homeLivingRow.tag] || (isAnalyzing ? "..." : "No analysis yet.")}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
          <h4 className="text-emerald-800 font-bold mb-2 flex items-center">
            <i className="fas fa-lightbulb mr-2"></i>
            How to read this table
          </h4>
          <p className="text-sm text-emerald-700 leading-relaxed">
            This view aggregates your spending by category across all uploaded statements. 
            The AI Insight column automatically detects trends, identifying where your spending 
            is increasing, decreasing, or remaining stable.
          </p>
        </div>
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
          <h4 className="text-blue-800 font-bold mb-2 flex items-center">
            <i className="fas fa-shield-halved mr-2"></i>
            Data Privacy
          </h4>
          <p className="text-sm text-blue-700 leading-relaxed">
            All comparisons are performed on the extracted data. Your original PDF files 
            are processed locally in your browser and never stored on our servers.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComparisonTab;
