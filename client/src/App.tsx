import { ReceiptUploader } from './components/ReceiptUploader';
import { ExpenseList } from './components/ExpenseList';
import { CategoryPieChart } from './components/CategoryPieChart';
import { MonthlyBarChart } from './components/MonthlyBarChart';
import { useExpenses } from './hooks/useExpenses';

export default function App() {
  const { receipts, categoryTotals, monthlyTotals, allItems, addReceipt, deleteReceipt, deleteItem, validateReceipt } =
    useExpenses();

  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthTotal = allItems
    .filter((i) => i.date.startsWith(currentMonth))
    .reduce((s, i) => s + i.price, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800">家計簿</h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">今月の支出</p>
            <p className="text-xl font-bold text-indigo-600">¥{thisMonthTotal.toLocaleString()}</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* サマリーカード */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '登録レシート', value: `${receipts.length}件`, icon: '🧾' },
            { label: '登録アイテム', value: `${allItems.length}件`, icon: '📝' },
            { label: '今月の件数', value: `${allItems.filter((i) => i.date.startsWith(currentMonth)).length}件`, icon: '📅' },
            { label: '全期間合計', value: `¥${allItems.reduce((s, i) => s + i.price, 0).toLocaleString()}`, icon: '💰' },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <p className="text-xl mb-1">{card.icon}</p>
              <p className="text-xs text-gray-400">{card.label}</p>
              <p className="text-lg font-bold text-gray-800">{card.value}</p>
            </div>
          ))}
        </div>

        {/* アップロードエリア */}
        <ReceiptUploader onValidate={validateReceipt} onParsed={addReceipt} />

        {/* グラフエリア */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CategoryPieChart categoryTotals={categoryTotals} />
          <MonthlyBarChart monthlyTotals={monthlyTotals} />
        </div>

        {/* レシート一覧 */}
        <ExpenseList
          receipts={receipts}
          onDeleteReceipt={deleteReceipt}
          onDeleteItem={deleteItem}
        />
      </main>
    </div>
  );
}
