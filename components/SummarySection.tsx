
import React from 'react';
import { Transaction, TransactionType } from '../types';

interface SummarySectionProps {
  transactions: Transaction[];
}

const SummarySection: React.FC<SummarySectionProps> = ({ transactions }) => {
  const definedTags = [
    "therapy", "grocery", "taxi", "gas", "laundry", 
    "amenities", "subscription", "massage", "temu", "food", "amazon", "cleaner", "transfers", "vet", "hospital"
  ];

  const withdrawals = transactions.filter(t => t.type === TransactionType.WITHDRAWAL);

  // Group sums by tag using lowercase keys for reliable matching
  const tagSums = withdrawals.reduce((acc, tx) => {
    const rawTag = tx.tag.toLowerCase();
    const key = definedTags.includes(rawTag) ? rawTag : "untagged";
    acc[key] = (acc[key] || 0) + tx.amount;
    return acc;
  }, {} as Record<string, number>);

  // Special "Home" calculation: laundry + amenities + grocery + cleaner
  const homeTotal = (tagSums["laundry"] || 0) + 
                    (tagSums["amenities"] || 0) + 
                    (tagSums["grocery"] || 0) + 
                    (tagSums["cleaner"] || 0);

  // Get list of untagged withdrawals
  const untaggedTransactions = withdrawals.filter(tx => {
    const rawTag = tx.tag.toLowerCase();
    return !definedTags.includes(rawTag);
  });

  return (
    <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <i className="fas fa-chart-bar mr-2 text-blue-600"></i>
          Spending Summary by Category
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {definedTags.map(tag => (
            <div key={tag} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{tag}</span>
              <span className="text-lg font-bold text-gray-800 mt-1">
                ${(tagSums[tag] || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
          
          {/* Home Total Card */}
          <div className="bg-blue-600 p-4 rounded-xl shadow-md flex flex-col justify-between text-white md:col-span-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">Home Total (Laundry, Amenities, Grocery, Cleaner)</span>
            <span className="text-2xl font-black mt-1">
              ${homeTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <i className="fas fa-circle-question mr-2 text-gray-500"></i>
          Untagged Withdrawals
        </h3>
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Detail</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {untaggedTransactions.length > 0 ? (
                untaggedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-700">{tx.detail}</td>
                    <td className="px-6 py-3 text-sm text-right font-medium text-red-600">
                      ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-sm text-gray-400 text-center italic">No untagged withdrawals found.</td>
                </tr>
              )}
            </tbody>
            {untaggedTransactions.length > 0 && (
              <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                <tr>
                  <td className="px-6 py-3 text-sm text-gray-900">Total Untagged</td>
                  <td className="px-6 py-3 text-sm text-right text-red-700">
                    ${(tagSums["untagged"] || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default SummarySection;
