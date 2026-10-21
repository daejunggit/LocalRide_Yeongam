import React from 'react';
import { Participant, EventConfig } from '../types';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Bus, Shirt, Gift, BarChart3 } from 'lucide-react';

interface AdminChartsProps {
  participants: Participant[];
  eventConfig: EventConfig;
}

export const AdminCharts: React.FC<AdminChartsProps> = ({ participants, eventConfig }) => {
  const totalCount = participants.length;
  const attendedCount = participants.filter((p) => p.isAttended).length;
  const unattendedCount = totalCount - attendedCount;
  const attendedRate = totalCount ? Math.round((attendedCount / totalCount) * 100) : 0;

  const tshirtDistributedCount = participants.filter((p) => p.isTshirtDistributed).length;
  const tshirtRemainingCount = totalCount - tshirtDistributedCount;
  const tshirtRate = totalCount ? Math.round((tshirtDistributedCount / totalCount) * 100) : 0;

  const prizeWinners = participants.filter((p) => p.isPrizeWinner);
  const prizeReceivedCount = prizeWinners.filter((p) => p.isPrizeReceived).length;
  const prizeRate = prizeWinners.length
    ? Math.round((prizeReceivedCount / prizeWinners.length) * 100)
    : 0;

  // 1. Attendance Pie Data
  const attendancePieData = [
    { name: '탑승 완료', value: attendedCount, color: '#3b82f6' },
    { name: '미탑승 (대기)', value: unattendedCount, color: '#64748b' },
  ];

  // 2. T-shirt Pie Data
  const tshirtPieData = [
    { name: '수령 완료', value: tshirtDistributedCount, color: '#6366f1' },
    { name: '미수령 (대기)', value: tshirtRemainingCount, color: '#f59e0b' },
  ];

  // 3. Size Breakdown Bar Data
  const sizes = ['S', 'M', 'L', 'XL', '2XL'];
  const sizeBarData = sizes.map((sz) => {
    const list = participants.filter((p) => p.tshirtSize.toUpperCase() === sz);
    const distributed = list.filter((p) => p.isTshirtDistributed).length;
    const remaining = list.length - distributed;
    return {
      size: sz,
      수령완료: distributed,
      미수령: remaining,
      총수량: list.length,
    };
  });

  // 4. Shop Prize Claim Bar Data
  const shopData = eventConfig.partnerShops.map((shop) => {
    const shopWinners = prizeWinners.filter(
      (p) =>
        p.prizeShop?.includes(shop.name) ||
        p.prizeShop?.includes(shop.city) ||
        p.prizeShop?.includes(shop.id)
    );
    const received = shopWinners.filter((p) => p.isPrizeReceived).length;
    const pending = shopWinners.length - received;
    return {
      shopName: shop.name,
      city: shop.city,
      수령완료: received,
      미수령: pending,
      총인원: shopWinners.length,
    };
  });

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-xl border border-slate-700">
          <p className="font-bold mb-1 text-slate-200">{label || payload[0]?.name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: entry.color || entry.fill }}
              />
              <span className="text-slate-300">{entry.name}:</span>
              <span className="font-extrabold text-white">{entry.value}명 / 벌</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          실시간 현황 시각화 차트 (Recharts)
        </h3>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
          데이터 실시간 반영
        </span>
      </div>

      {/* Row 1: Pie Charts (Attendance & T-Shirt Distribution Rates) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendance Pie */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
              <Bus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              탑승 & 출석률 현황
            </h4>
            <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
              {attendedRate}% 달성
            </span>
          </div>

          <div className="h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendancePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {attendancePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(val, entry: any) => (
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {val} ({entry.payload.value}명)
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center percentage badge */}
            <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 dark:text-white block leading-tight">
                {attendedRate}%
              </span>
              <span className="text-[10px] font-bold text-slate-400">탑승완료</span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium px-2">
            <span>총 인원: <strong className="text-slate-800 dark:text-slate-200">{totalCount}명</strong></span>
            <span>탑승: <strong className="text-blue-600 dark:text-blue-400">{attendedCount}명</strong></span>
            <span>미탑승: <strong className="text-slate-400">{unattendedCount}명</strong></span>
          </div>
        </div>

        {/* T-Shirt Receipt Pie */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
              <Shirt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              티셔츠 분출률 현황
            </h4>
            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
              {tshirtRate}% 분출
            </span>
          </div>

          <div className="h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tshirtPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {tshirtPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(val, entry: any) => (
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {val} ({entry.payload.value}벌)
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center percentage badge */}
            <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 dark:text-white block leading-tight">
                {tshirtRate}%
              </span>
              <span className="text-[10px] font-bold text-slate-400">분출완료</span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium px-2">
            <span>준비 수량: <strong className="text-slate-800 dark:text-slate-200">{totalCount}벌</strong></span>
            <span>분출: <strong className="text-indigo-600 dark:text-indigo-400">{tshirtDistributedCount}벌</strong></span>
            <span>잔여: <strong className="text-amber-500">{tshirtRemainingCount}벌</strong></span>
          </div>
        </div>
      </div>

      {/* Row 2: Bar Charts (Size Breakdown & Shop Prize Pickup) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Size Distribution Stacked Bar Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
              <Shirt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              사이즈별 티셔츠 분출 & 잔여 수량 (바 차트)
            </h4>
            <span className="text-xs font-bold text-slate-400">S ~ 2XL</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sizeBarData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <XAxis dataKey="size" tick={{ fontSize: 12, fontWeight: 'bold' }} stroke="#94a3b8" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={32}
                  formatter={(val) => <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{val}</span>}
                />
                <Bar dataKey="수령완료" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                <Bar dataKey="미수령" stackId="a" fill="#64748b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-400 text-center mt-1">
            * 각 사이즈별 분출 완료(보라색) 및 분출 대기 잔여량(회색) 누적 바
          </p>
        </div>

        {/* Shop Prize Distribution Bar Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-amber-500" />
              매장별 기념품 수령 현황 (서울 bb5 vs 부산 occ)
            </h4>
            <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
              총 {prizeReceivedCount}/{prizeWinners.length}명 수령 ({prizeRate}%)
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shopData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <XAxis
                  dataKey="shopName"
                  tick={{ fontSize: 12, fontWeight: 'bold' }}
                  stroke="#94a3b8"
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={32}
                  formatter={(val) => <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{val}</span>}
                />
                <Bar dataKey="수령완료" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                <Bar dataKey="미수령" fill="#94a3b8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-400 text-center mt-1">
            * 각 제휴 매장 카운터에서 신분증 확인 후 수령 처리된 실시간 현황
          </p>
        </div>
      </div>
    </div>
  );
};
