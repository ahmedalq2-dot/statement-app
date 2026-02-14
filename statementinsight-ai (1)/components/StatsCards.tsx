
import React from 'react';
import { Transaction, TransactionType } from '../types';

interface StatsCardsProps {
  transactions: Transaction[];
}

const StatsCards: React.FC<StatsCardsProps> = ({ transactions }) => {
  const stats = transactions.reduce((acc, tx) => {
    if (tx.type === TransactionType.WITHDRAWAL) {
      acc.totalWithdrawals += tx.amount;
    } else {
      acc.totalDeposits += tx.amount;
    }
    return acc;
  }, { totalWithdrawals: 0, totalDeposits: 0 });

  const cards = [
    {
      label: 'Total Withdrawals',
      value: stats.totalWithdrawals,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      icon: 'fa-arrow-trend-down'
    },
    {
      label: 'Total Deposits',
      value: stats.totalDeposits,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      icon: 'fa-arrow-trend-up'
    },
    {
      label: 'Net Cash Flow',
      value: stats.totalDeposits - stats.totalWithdrawals,
      color: (stats.totalDeposits - stats.totalWithdrawals) >= 0 ? 'text-blue-600' : 'text-red-600',
      bgColor: 'bg-blue-50',
      icon: 'fa-wallet'
    },
    {
      label: 'Transactions',
      value: transactions.length,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      icon: 'fa-list-check',
      isCurrency: false
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">{card.label}</span>
            <div className={`${card.bgColor} ${card.color} w-10 h-10 rounded-lg flex items-center justify-center`}>
              <i className={`fas ${card.icon}`}></i>
            </div>
          </div>
          <div className={`text-2xl font-bold ${card.color}`}>
            {card.isCurrency === false ? card.value : `$${card.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
