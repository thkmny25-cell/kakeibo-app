import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { CATEGORY_COLORS, CATEGORIES } from '../types';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  categoryTotals: Record<string, number>;
}

export function CategoryPieChart({ categoryTotals }: Props) {
  const labels = CATEGORIES.filter((c) => categoryTotals[c] > 0);
  const data = labels.map((c) => categoryTotals[c]);
  const colors = labels.map((c) => CATEGORY_COLORS[c]);

  if (labels.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">カテゴリ別支出</h2>
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          データがありません
        </div>
      </div>
    );
  }

  const total = data.reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-1">カテゴリ別支出</h2>
      <p className="text-sm text-gray-500 mb-4">合計 ¥{total.toLocaleString()}</p>

      <div className="flex items-center gap-6">
        <div className="w-48 h-48 flex-shrink-0">
          <Doughnut
            data={{
              labels,
              datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff' }],
            }}
            options={{
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (ctx) => ` ¥${(ctx.raw as number).toLocaleString()}`,
                  },
                },
              },
              cutout: '60%',
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {labels.map((cat) => (
            <div key={cat} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-1.5 min-w-0">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                />
                <span className="text-gray-700 truncate">{cat}</span>
              </div>
              <span className="text-gray-600 font-medium flex-shrink-0">
                ¥{categoryTotals[cat].toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
