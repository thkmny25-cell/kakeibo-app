import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Props {
  monthlyTotals: Record<string, number>;
}

function formatMonth(ym: string) {
  const [year, month] = ym.split('-');
  return `${year}年${parseInt(month)}月`;
}

export function MonthlyBarChart({ monthlyTotals }: Props) {
  // 直近6ヶ月を表示
  const sortedMonths = Object.keys(monthlyTotals).sort().slice(-6);

  if (sortedMonths.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">月別支出</h2>
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          データがありません
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">月別支出</h2>
      <div className="h-52">
        <Bar
          data={{
            labels: sortedMonths.map(formatMonth),
            datasets: [
              {
                label: '支出',
                data: sortedMonths.map((m) => monthlyTotals[m]),
                backgroundColor: 'rgba(99, 102, 241, 0.7)',
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 1,
                borderRadius: 6,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => ` ¥${(ctx.raw as number).toLocaleString()}`,
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: (v) => `¥${Number(v).toLocaleString()}`,
                  font: { size: 11 },
                },
                grid: { color: 'rgba(0,0,0,0.05)' },
              },
              x: {
                ticks: { font: { size: 11 } },
                grid: { display: false },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
