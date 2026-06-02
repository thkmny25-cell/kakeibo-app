import { useState } from 'react';
import type { Receipt } from '../types';
import { CATEGORY_COLORS } from '../types';

interface Props {
  receipts: Receipt[];
  onDeleteReceipt: (id: string) => void;
  onDeleteItem: (id: string) => void;
}

export function ExpenseList({ receipts, onDeleteReceipt, onDeleteItem }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (receipts.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
        <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
        </svg>
        <p className="text-gray-400">レシートがまだ登録されていません</p>
        <p className="text-gray-300 text-sm mt-1">上のエリアに画像をアップロードしてください</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">登録済みレシート</h2>

      <div className="flex flex-col gap-3">
        {receipts.map((receipt) => {
          const total = receipt.items.reduce((s, i) => s + i.price, 0);
          const isOpen = expanded.has(receipt.id);

          return (
            <div key={receipt.id} className="border border-gray-100 rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                onClick={() => toggle(receipt.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <svg
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate">{receipt.store || '店舗不明'}</p>
                    <p className="text-xs text-gray-400">{receipt.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-bold text-gray-800">¥{total.toLocaleString()}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteReceipt(receipt.id); }}
                    className="text-gray-300 hover:text-red-400 transition-colors p-1"
                    title="レシートを削除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-gray-50 divide-y divide-gray-50">
                  {receipt.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-2.5 bg-gray-50/50">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                          style={{
                            backgroundColor: CATEGORY_COLORS[item.category] + '30',
                            color: CATEGORY_COLORS[item.category],
                          }}
                        >
                          {item.category}
                        </span>
                        <span className="text-sm text-gray-700 truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm font-medium text-gray-700">¥{item.price.toLocaleString()}</span>
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="text-gray-300 hover:text-red-400 transition-colors"
                          title="この項目を削除"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
