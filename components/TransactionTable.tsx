
import React from 'react';
import { Transaction, TransactionType } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions }) => {
  if (transactions.length === 0) return null;

  const getTagStyle = (tag: string) => {
    const t = tag.toLowerCase();
    switch (t) {
      case 'subscription': return 'bg-purple-100 text-purple-700';
      case 'food': return 'bg-orange-100 text-orange-700';
      case 'amazon': return 'bg-blue-100 text-blue-700';
      case 'therapy': return 'bg-rose-100 text-rose-700';
      case 'grocery': return 'bg-emerald-100 text-emerald-700';
      case 'taxi': return 'bg-yellow-100 text-yellow-800';
      case 'gas': return 'bg-slate-200 text-slate-700';
      case 'laundry': return 'bg-cyan-100 text-cyan-700';
      case 'amenities': return 'bg-indigo-100 text-indigo-700';
      case 'massage': return 'bg-pink-100 text-pink-700';
      case 'temu': return 'bg-orange-200 text-orange-900';
      case 'cleaner': return 'bg-teal-100 text-teal-700';
      case 'transfers': return 'bg-violet-100 text-violet-700';
      case 'vet': return 'bg-emerald-50 text-emerald-600';
      case 'hospital': return 'bg-red-50 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Detail / Tag</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Amount</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {tx.date}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-800">{tx.detail}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit mt-1 ${getTagStyle(tx.tag)}`}>
                      {tx.tag}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <span className={`font-semibold ${tx.type === TransactionType.WITHDRAWAL ? 'text-red-600' : 'text-green-600'}`}>
                    {tx.type === TransactionType.WITHDRAWAL ? '-' : '+'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-800">
                  ${tx.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;
