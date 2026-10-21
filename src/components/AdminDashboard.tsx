import React, { useState } from 'react';
import { Participant, EventConfig, GoogleSheetsConfig } from '../types';
import { QRCodeHub } from './QRCodeHub';
import { exportParticipantsToExcel, downloadSampleExcelTemplate, parseExcelFile } from '../services/excelService';
import { GOOGLE_APPS_SCRIPT_TEMPLATE, testGASConnection } from '../services/googleSheets';
import { maskPhone, formatPhone } from '../services/storage';
import { AdminCharts } from './AdminCharts';
import {
  Users, Bus, Shirt, Gift, QrCode, Cloud, Settings, Search,
  FileSpreadsheet, Upload, Download, Plus, Trash2, Edit3, CheckCircle2,
  Clock, X, Check, Copy, AlertCircle, RefreshCw, PhoneCall, ExternalLink, Filter, BarChart3, Pencil
} from 'lucide-react';

interface AdminDashboardProps {
  participants: Participant[];
  eventConfig: EventConfig;
  sheetsConfig: GoogleSheetsConfig;
  onUpdateParticipants: (data: Participant[]) => void;
  onUpdateEventConfig: (data: EventConfig) => void;
  onUpdateSheetsConfig: (data: GoogleSheetsConfig) => void;
  onToggleCheckin: (id: string, attended: boolean) => void;
  onToggleTshirt: (id: string, distributed: boolean) => void;
  onTogglePrize: (id: string, shop: string, received: boolean) => void;
  onSyncWithGAS?: () => Promise<void>;
  onFetchFromGAS?: () => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  participants,
  eventConfig,
  sheetsConfig,
  onUpdateParticipants,
  onUpdateEventConfig,
  onUpdateSheetsConfig,
  onToggleCheckin,
  onToggleTshirt,
  onTogglePrize,
  onSyncWithGAS,
  onFetchFromGAS,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'charts' | 'checkin' | 'tshirt' | 'prize' | 'roster' | 'qrhub' | 'sheets' | 'settings'
  >('overview');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [checkinFilter, setCheckinFilter] = useState<'all' | 'attended' | 'not_attended'>('all');
  const [tshirtFilter, setTshirtFilter] = useState<'all' | 'received' | 'not_received'>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [shopFilter, setShopFilter] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // New Participant Form State
  const [formData, setFormData] = useState<Partial<Participant>>({
    name: '',
    phone: '',
    tshirtSize: 'L',
    isPrizeWinner: false,
    prizeItem: '',
    prizeShop: '서울 bb5',
    notes: '',
  });

  // Google Sheets Test state
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [testingGAS, setTestingGAS] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Inline Editing State
  interface EditingCellState {
    id: string;
    field: 'name' | 'phone' | 'tshirtSize';
    value: string;
  }
  const [editingCell, setEditingCell] = useState<EditingCellState | null>(null);

  const handleSaveInline = (
    id: string,
    field: 'name' | 'phone' | 'tshirtSize',
    value: string
  ) => {
    const updated = participants.map((p) => {
      if (p.id !== id) return p;
      if (field === 'name') {
        const trimmed = value.trim();
        return { ...p, name: trimmed || p.name };
      }
      if (field === 'phone') {
        const clean = value.replace(/\D/g, '');
        const last4 = clean.slice(-4);
        return {
          ...p,
          phone: formatPhone(value),
          phoneLast4: last4 || p.phoneLast4,
        };
      }
      if (field === 'tshirtSize') {
        return { ...p, tshirtSize: value };
      }
      return p;
    });
    onUpdateParticipants(updated);
    setEditingCell(null);
  };

  const renderEditableName = (p: Participant) => {
    if (editingCell?.id === p.id && editingCell.field === 'name') {
      return (
        <input
          type="text"
          autoFocus
          value={editingCell.value}
          onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
          onBlur={() => handleSaveInline(p.id, 'name', editingCell.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveInline(p.id, 'name', editingCell.value);
            if (e.key === 'Escape') setEditingCell(null);
          }}
          className="px-2 py-0.5 rounded-lg border-2 border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm w-28 focus:outline-none ring-2 ring-blue-100 dark:ring-blue-900"
        />
      );
    }
    return (
      <button
        type="button"
        onClick={() => setEditingCell({ id: p.id, field: 'name', value: p.name })}
        className="text-left font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 group cursor-pointer"
        title="클릭하여 이름 직접 수정"
      >
        <span className="border-b border-dashed border-slate-300 dark:border-slate-700 group-hover:border-blue-500">
          {p.name}
        </span>
        <Pencil className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  };

  const renderEditablePhone = (p: Participant) => {
    if (editingCell?.id === p.id && editingCell.field === 'phone') {
      return (
        <input
          type="tel"
          autoFocus
          value={editingCell.value}
          onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
          onBlur={() => handleSaveInline(p.id, 'phone', editingCell.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveInline(p.id, 'phone', editingCell.value);
            if (e.key === 'Escape') setEditingCell(null);
          }}
          className="px-2 py-0.5 rounded-lg border-2 border-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs w-36 focus:outline-none ring-2 ring-blue-100 dark:ring-blue-900"
        />
      );
    }
    return (
      <button
        type="button"
        onClick={() => setEditingCell({ id: p.id, field: 'phone', value: p.phone })}
        className="text-left font-mono text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 group cursor-pointer"
        title="클릭하여 연락처 직접 수정"
      >
        <span className="border-b border-dashed border-slate-300 dark:border-slate-700 group-hover:border-blue-500">
          {p.phone}
        </span>
        <Pencil className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  };

  const renderEditableTshirt = (p: Participant) => {
    if (editingCell?.id === p.id && editingCell.field === 'tshirtSize') {
      return (
        <select
          autoFocus
          value={editingCell.value}
          onChange={(e) => handleSaveInline(p.id, 'tshirtSize', e.target.value)}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setEditingCell(null);
          }}
          className="px-2 py-0.5 rounded-lg border-2 border-indigo-500 bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 font-black text-xs focus:outline-none ring-2 ring-indigo-100 dark:ring-indigo-900"
        >
          <option value="S">S (90)</option>
          <option value="M">M (95)</option>
          <option value="L">L (100)</option>
          <option value="XL">XL (105)</option>
          <option value="2XL">2XL (110)</option>
          <option value="3XL">3XL (115)</option>
        </select>
      );
    }
    return (
      <button
        type="button"
        onClick={() => setEditingCell({ id: p.id, field: 'tshirtSize', value: p.tshirtSize })}
        className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-extrabold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-transparent hover:border-indigo-300 flex items-center gap-1 group cursor-pointer transition-all"
        title="클릭하여 사이즈 직접 변경"
      >
        <span>{p.tshirtSize}</span>
        <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-indigo-400 transition-opacity" />
      </button>
    );
  };

  // Stats Calculations
  const totalCount = participants.length;
  const attendedCount = participants.filter((p) => p.isAttended).length;
  const attendedRate = totalCount ? Math.round((attendedCount / totalCount) * 100) : 0;

  const tshirtCount = participants.filter((p) => p.isTshirtDistributed).length;
  const tshirtRate = totalCount ? Math.round((tshirtCount / totalCount) * 100) : 0;

  const prizeWinners = participants.filter((p) => p.isPrizeWinner);
  const prizeCount = prizeWinners.filter((p) => p.isPrizeReceived).length;
  const prizeRate = prizeWinners.length ? Math.round((prizeCount / prizeWinners.length) * 100) : 0;

  // Size statistics
  const sizeStats = ['S', 'M', 'L', 'XL', '2XL'].map((size) => {
    const total = participants.filter((p) => p.tshirtSize.toUpperCase() === size).length;
    const distributed = participants.filter(
      (p) => p.tshirtSize.toUpperCase() === size && p.isTshirtDistributed
    ).length;
    return {
      size,
      total,
      distributed,
      remaining: total - distributed,
      pct: total ? Math.round((distributed / total) * 100) : 0,
    };
  });

  // Handlers for Add / Edit
  const handleSaveParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert('이름과 휴대폰 번호를 입력해 주세요.');
      return;
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    const phoneLast4 = cleanPhone.slice(-4);

    if (editingParticipant) {
      const updated = participants.map((p) =>
        p.id === editingParticipant.id
          ? {
              ...p,
              ...formData,
              name: formData.name!,
              phone: formData.phone!,
              phoneLast4,
              tshirtSize: formData.tshirtSize || 'L',
            }
          : p
      );
      onUpdateParticipants(updated);
      setEditingParticipant(null);
    } else {
      const newP: Participant = {
        id: `p-${Date.now()}`,
        name: formData.name!,
        phone: formData.phone!,
        phoneLast4,
        tshirtSize: formData.tshirtSize || 'L',
        isAttended: false,
        attendedAt: null,
        isTshirtDistributed: false,
        tshirtDistributedAt: null,
        isPrizeWinner: Boolean(formData.isPrizeWinner),
        prizeItem: formData.prizeItem || null,
        prizeShop: formData.prizeShop || null,
        isPrizeReceived: false,
        prizeReceivedAt: null,
        notes: formData.notes || '',
      };
      onUpdateParticipants([newP, ...participants]);
    }

    setIsAddModalOpen(false);
    setFormData({
      name: '',
      phone: '',
      tshirtSize: 'L',
      isPrizeWinner: false,
      prizeItem: '',
      prizeShop: '서울 bb5',
      notes: '',
    });
  };

  const handleDeleteParticipant = (id: string, name: string) => {
    if (confirm(`정말 [${name}] 참가자를 명단에서 삭제하시겠습니까?`)) {
      onUpdateParticipants(participants.filter((p) => p.id !== id));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadStatus('엑셀 파일 분석 중...');
      const parsed = await parseExcelFile(file);
      if (parsed.length === 0) {
        setUploadStatus('가져올 참가자 데이터가 없습니다.');
        return;
      }

      const mode = confirm(
        `총 ${parsed.length}명의 데이터를 읽었습니다.\n\n[확인]을 누르면 기존 명단에 추가하고,\n[취소]를 누르면 작업을 중단합니다.`
      );
      if (mode) {
        onUpdateParticipants([...participants, ...(parsed as Participant[])]);
        setUploadStatus(`성공: ${parsed.length}명이 명단에 추가되었습니다.`);
      } else {
        setUploadStatus(null);
      }
    } catch (err: any) {
      alert(`엑셀 파일 처리 오류: ${err.message}`);
      setUploadStatus(null);
    }
  };

  const handleTestGAS = async () => {
    setTestingGAS(true);
    setTestResult(null);
    const res = await testGASConnection(sheetsConfig.webAppUrl);
    setTestResult(res);
    setTestingGAS(false);
  };

  const handleCopyGASCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Filtered participants list for search
  const filteredParticipants = participants.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchQuery =
      p.name.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.phoneLast4.includes(q) ||
      (p.prizeItem && p.prizeItem.toLowerCase().includes(q));

    if (!matchQuery) return false;

    if (activeTab === 'checkin') {
      if (checkinFilter === 'attended') return p.isAttended;
      if (checkinFilter === 'not_attended') return !p.isAttended;
    }

    if (activeTab === 'tshirt') {
      if (tshirtFilter === 'received') return p.isTshirtDistributed;
      if (tshirtFilter === 'not_received') return !p.isTshirtDistributed;
      if (sizeFilter !== 'all') return p.tshirtSize.toUpperCase() === sizeFilter;
    }

    if (activeTab === 'prize') {
      if (!p.isPrizeWinner) return false;
      if (shopFilter !== 'all') {
        if (!p.prizeShop?.includes(shopFilter)) return false;
      }
    }

    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Admin Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            운영진 전용 관리 콘솔
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            출석·티셔츠·기념품 종합 관리
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportParticipantsToExcel(participants, `${eventConfig.title}_명단.xlsx`)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            엑셀 다운로드
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingParticipant(null);
              setFormData({
                name: '',
                phone: '',
                tshirtSize: 'L',
                isPrizeWinner: false,
                prizeItem: '',
                prizeShop: '서울 bb5',
                notes: '',
              });
              setIsAddModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            참가자 직접 추가
          </button>
        </div>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Attendance Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Bus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              탑승 & 출석 완료
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {attendedCount} <span className="text-base text-slate-400 font-normal">/ {totalCount}명</span>
            </div>
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1">
              탑승률 {attendedRate}%
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-lg">
            {attendedRate}%
          </div>
        </div>

        {/* T-Shirt Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Shirt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              티셔츠 분출 현황
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {tshirtCount} <span className="text-base text-slate-400 font-normal">/ {totalCount}벌</span>
            </div>
            <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
              분출률 {tshirtRate}% (미수령 {totalCount - tshirtCount}벌)
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-lg">
            {tshirtRate}%
          </div>
        </div>

        {/* Prize Winner Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              매장 기념품 수령
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {prizeCount} <span className="text-base text-slate-400 font-normal">/ {prizeWinners.length}명</span>
            </div>
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
              수령률 {prizeRate}% (미수령 {prizeWinners.length - prizeCount}명)
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-lg">
            {prizeRate}%
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl overflow-x-auto scrollbar-none mb-6">
        {[
          { key: 'overview', label: '종합 요약', icon: Users },
          { key: 'charts', label: '통계 차트', icon: BarChart3 },
          { key: 'checkin', label: '출석부 현황', icon: Bus },
          { key: 'tshirt', label: '티셔츠 분출 관리', icon: Shirt },
          { key: 'prize', label: '이벤트 당첨자', icon: Gift },
          { key: 'roster', label: '명단·엑셀 관리', icon: FileSpreadsheet },
          { key: 'qrhub', label: 'QR 코드 & 인쇄', icon: QrCode },
          { key: 'sheets', label: 'Google 시트 연동', icon: Cloud },
          { key: 'settings', label: '모임 설정', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* T-Shirt Size Breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <h3 className="font-extrabold text-slate-900 text-lg mb-4 flex items-center gap-2">
              <Shirt className="w-5 h-5 text-indigo-600" />
              사이즈별 티셔츠 분출 진행 현황표
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {sizeStats.map((item) => (
                <div key={item.size} className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-indigo-600">{item.size}</span>
                    <span className="text-xs font-bold text-slate-500">{item.pct}%</span>
                  </div>
                  <div className="text-xl font-black text-slate-900">
                    {item.distributed} <span className="text-xs text-slate-400 font-normal">/ {item.total}벌</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1.5">
                    잔여 수량: <strong className="text-slate-700">{item.remaining}벌</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Recharts Section */}
          <AdminCharts participants={participants} eventConfig={eventConfig} />

          {/* Quick Real-Time Boarding & Distribution List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Unattended Call List */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Bus className="w-4 h-4 text-amber-500" />
                  미탑승자 명단 ({participants.filter((p) => !p.isAttended).length}명)
                </h3>
                <span className="text-xs text-slate-400">출발 전 연락 필요</span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {participants
                  .filter((p) => !p.isAttended)
                  .map((person) => (
                    <div
                      key={person.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs sm:text-sm"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{person.name}</span>
                        <span className="text-xs text-slate-500 ml-2 font-mono">
                          {person.phone}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${person.phone}`}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                          title="전화 걸기"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => onToggleCheckin(person.id, true)}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 cursor-pointer"
                        >
                          탑승 확인
                        </button>
                      </div>
                    </div>
                  ))}
                {participants.filter((p) => !p.isAttended).length === 0 && (
                  <div className="text-center py-8 text-emerald-600 font-bold text-sm">
                    🎉 전원 탑승 완료되었습니다!
                  </div>
                )}
              </div>
            </div>

            {/* Unreceived T-Shirts */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-indigo-500" />
                  티셔츠 미수령자 ({participants.filter((p) => !p.isTshirtDistributed).length}명)
                </h3>
                <span className="text-xs text-slate-400">분출소 대기</span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {participants
                  .filter((p) => !p.isTshirtDistributed)
                  .map((person) => (
                    <div
                      key={person.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs sm:text-sm"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{person.name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-xs ml-2">
                          {person.tshirtSize}
                        </span>
                        <span className="text-xs text-slate-400 ml-1.5">
                          (뒷자리 {person.phoneLast4})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleTshirt(person.id, true)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 cursor-pointer"
                      >
                        분출 완료
                      </button>
                    </div>
                  ))}
                {participants.filter((p) => !p.isTshirtDistributed).length === 0 && (
                  <div className="text-center py-8 text-emerald-600 font-bold text-sm">
                    🎉 모든 참가자에게 티셔츠 분출이 완료되었습니다!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CHARTS (Recharts Deep Dive) */}
      {activeTab === 'charts' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <AdminCharts participants={participants} eventConfig={eventConfig} />
        </div>
      )}

      {/* TAB CONTENT: 2. CHECKIN ROSTER */}
      {activeTab === 'checkin' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">
                🚌 모임 탑승·출석부 현황표
              </h3>
              <p className="text-xs text-slate-500">
                참가자가 QR로 뒷자리를 입력하거나, 관리자가 아래에서 원터치로 체크할 수 있습니다.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCheckinFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  checkinFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                전체 ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setCheckinFilter('attended')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  checkinFilter === 'attended'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                탑승완료 ({attendedCount})
              </button>
              <button
                type="button"
                onClick={() => setCheckinFilter('not_attended')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  checkinFilter === 'not_attended'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                미탑승 ({totalCount - attendedCount})
              </button>
            </div>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="이름, 휴대폰 번호, 뒷자리 4자리로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs uppercase font-extrabold">
                <tr>
                  <th className="py-3 px-4">이름 (클릭수정)</th>
                  <th className="py-3 px-4">연락처 (클릭수정)</th>
                  <th className="py-3 px-4">뒷자리</th>
                  <th className="py-3 px-4">사이즈 (클릭수정)</th>
                  <th className="py-3 px-4">탑승 확인 상태</th>
                  <th className="py-3 px-4">확인 일시</th>
                  <th className="py-3 px-4 text-right">상태 토글</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredParticipants.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3 px-4">{renderEditableName(p)}</td>
                    <td className="py-3 px-4">{renderEditablePhone(p)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">{p.phoneLast4}</td>
                    <td className="py-3 px-4">{renderEditableTshirt(p)}</td>
                    <td className="py-3 px-4">
                      {p.isAttended ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 탑승완료
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                          <Clock className="w-3.5 h-3.5" /> 미탑승
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                      {p.attendedAt || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onToggleCheckin(p.id, !p.isAttended)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          p.isAttended
                            ? 'bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                        }`}
                      >
                        {p.isAttended ? '취소하기' : '탑승 처리'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. T-SHIRT DISTRIBUTION SHEET */}
      {activeTab === 'tshirt' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">
                👕 티셔츠 분출 관리 현황표
              </h3>
              <p className="text-xs text-slate-500">
                수령자 및 미수령자가 실시간으로 분류되며 현장에서 바로 분출 체크할 수 있습니다.
              </p>
            </div>

            {/* Filter */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setTshirtFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  tshirtFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                전체 ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setTshirtFilter('received')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  tshirtFilter === 'received'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                수령완료 ({tshirtCount})
              </button>
              <button
                type="button"
                onClick={() => setTshirtFilter('not_received')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  tshirtFilter === 'not_received'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                미수령 ({totalCount - tshirtCount})
              </button>
            </div>
          </div>

          {/* Size Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-bold shrink-0">사이즈 필터:</span>
            {['all', 'S', 'M', 'L', 'XL', '2XL'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSizeFilter(s)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  sizeFilter === s
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s === 'all' ? '전체 사이즈' : s}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="참가자 이름, 휴대폰 뒷자리 4자리로 빠른 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs uppercase font-extrabold">
                <tr>
                  <th className="py-3 px-4">이름 (클릭수정)</th>
                  <th className="py-3 px-4">뒷자리</th>
                  <th className="py-3 px-4">신청 사이즈 (클릭수정)</th>
                  <th className="py-3 px-4">수령 여부</th>
                  <th className="py-3 px-4">수령 일시</th>
                  <th className="py-3 px-4 text-right">분출 체크</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredParticipants.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3 px-4">{renderEditableName(p)}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{p.phoneLast4}</td>
                    <td className="py-3 px-4">{renderEditableTshirt(p)}</td>
                    <td className="py-3 px-4">
                      {p.isTshirtDistributed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 수령완료
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3.5 h-3.5" /> 미수령
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                      {p.tshirtDistributedAt || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onToggleTshirt(p.id, !p.isTshirtDistributed)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          p.isTshirtDistributed
                            ? 'bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                        }`}
                      >
                        {p.isTshirtDistributed ? '분출 취소' : '분출 완료 처리'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. PRIZE WINNERS */}
      {activeTab === 'prize' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">
                🎁 이벤트 당첨자 & 매장 수령 현황
              </h3>
              <p className="text-xs text-slate-500">
                서울 bb5, 부산 occ 등 협력 매장 방문 시 QR 및 신분증 확인 후 수령해 가는 당첨자 명단입니다.
              </p>
            </div>

            {/* Shop filter */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShopFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  shopFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                전체 매장 ({prizeWinners.length})
              </button>
              <button
                type="button"
                onClick={() => setShopFilter('bb5')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  shopFilter === 'bb5'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                서울 bb5 ({prizeWinners.filter((p) => p.prizeShop?.includes('bb5')).length})
              </button>
              <button
                type="button"
                onClick={() => setShopFilter('occ')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                  shopFilter === 'occ'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                부산 occ ({prizeWinners.filter((p) => p.prizeShop?.includes('occ')).length})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs uppercase font-extrabold">
                <tr>
                  <th className="py-3 px-4">당첨자 성명</th>
                  <th className="py-3 px-4">연락처</th>
                  <th className="py-3 px-4">뒷자리</th>
                  <th className="py-3 px-4">당첨 아이템</th>
                  <th className="py-3 px-4">지정 수령 매장</th>
                  <th className="py-3 px-4">수령 상태</th>
                  <th className="py-3 px-4">수령 일시</th>
                  <th className="py-3 px-4 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredParticipants.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{p.name}</td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-600">{p.phone}</td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-600">{p.phoneLast4}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      🎁 {p.prizeItem || '이벤트 기념품'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 font-bold text-xs border border-amber-200">
                        {p.prizeShop || '매장'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {p.isPrizeReceived ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 수령완료
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3.5 h-3.5" /> 미수령 (방문대기)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 font-mono">
                      {p.prizeReceivedAt || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onTogglePrize(p.id, p.prizeShop || '매장', !p.isPrizeReceived)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          p.isPrizeReceived
                            ? 'bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600'
                            : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
                        }`}
                      >
                        {p.isPrizeReceived ? '수령 취소' : '수령 처리'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. ROSTER & EXCEL MANAGEMENT */}
      {activeTab === 'roster' && (
        <div className="space-y-6">
          {/* Excel File Box */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <h3 className="font-extrabold text-slate-900 text-lg mb-2 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              엑셀 파일(XLSX/CSV) 일괄 첨부 및 업로드
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              사전에 작성된 참가자 엑셀 명단을 업로드하면 휴대폰 번호 및 뒷자리 4자리, 티셔츠 사이즈가 자동으로 등록됩니다.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Upload Drop Zone */}
              <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50 hover:bg-emerald-50/30 transition-all">
                <Upload className="w-10 h-10 text-slate-400 mb-2" />
                <span className="font-bold text-slate-800 text-sm">
                  엑셀 파일 (.xlsx, .csv) 선택 또는 드래그
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  클릭하여 컴퓨터의 파일을 선택하세요
                </span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Template & Export Download Box */}
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">
                    양식 템플릿 & 현재 명단 다운로드
                  </h4>
                  <p className="text-xs text-slate-500">
                    표준 양식 엑셀을 내려받아 작성 후 업로드하거나, 현재 실시간 출석 현황이 포함된 전체 데이터를 엑셀로 백업할 수 있습니다.
                  </p>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={downloadSampleExcelTemplate}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    양식 샘플 받기
                  </button>
                  <button
                    type="button"
                    onClick={() => exportParticipantsToExcel(participants, `${eventConfig.title}_명단.xlsx`)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    현재 명단 엑셀 내보내기
                  </button>
                </div>
              </div>
            </div>

            {uploadStatus && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                {uploadStatus}
              </div>
            )}
          </div>

          {/* Complete Participants Table with Edit / Delete */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                등록된 참가자 전체 명단 ({participants.length}명)
              </h3>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-xl flex items-center gap-1.5 w-fit">
                <Pencil className="w-3.5 h-3.5" />
                이름, 연락처, 사이즈 셀을 클릭하여 바로 수정 가능
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs uppercase font-extrabold">
                  <tr>
                    <th className="py-3 px-4">이름 (클릭수정)</th>
                    <th className="py-3 px-4">휴대폰 번호 (클릭수정)</th>
                    <th className="py-3 px-4">뒷자리</th>
                    <th className="py-3 px-4">티셔츠 (클릭수정)</th>
                    <th className="py-3 px-4">탑승여부</th>
                    <th className="py-3 px-4">티셔츠분출</th>
                    <th className="py-3 px-4">이벤트기념품</th>
                    <th className="py-3 px-4 text-right">수정/삭제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {participants.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-3 px-4">{renderEditableName(p)}</td>
                      <td className="py-3 px-4">{renderEditablePhone(p)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">{p.phoneLast4}</td>
                      <td className="py-3 px-4">{renderEditableTshirt(p)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            p.isAttended ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {p.isAttended ? '탑승' : '미탑승'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            p.isTshirtDistributed
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.isTshirtDistributed ? '수령' : '미수령'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {p.isPrizeWinner ? (
                          <span className="text-amber-700 font-bold">
                            🎁 {p.prizeShop}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingParticipant(p);
                              setFormData({
                                name: p.name,
                                phone: p.phone,
                                tshirtSize: p.tshirtSize,
                                isPrizeWinner: p.isPrizeWinner,
                                prizeItem: p.prizeItem || '',
                                prizeShop: p.prizeShop || '서울 bb5',
                                notes: p.notes || '',
                              });
                              setIsAddModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="수정"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteParticipant(p.id, p.name)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 6. QR HUB & PRINT */}
      {activeTab === 'qrhub' && <QRCodeHub eventConfig={eventConfig} />}

      {/* TAB CONTENT: 7. GOOGLE SHEETS & APPS SCRIPT SYNC */}
      {activeTab === 'sheets' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 mb-2">
                  <Cloud className="w-3.5 h-3.5" />
                  Google Apps Script & 구글 스프레드시트 데이터베이스 연동
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  Google 스프레드시트 실시간 동기화 설정
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                  구글 스프레드시트를 데이터베이스로 활용하여 출석 체크와 티셔츠 분출 내역을 구글 시트 행에 실시간으로 기록할 수 있습니다.
                </p>
              </div>
            </div>

            {/* Web App URL input */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-6 space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Google Apps Script 배포 웹 앱 URL (Web App URL)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={sheetsConfig.webAppUrl}
                  onChange={(e) =>
                    onUpdateSheetsConfig({ ...sheetsConfig, webAppUrl: e.target.value })
                  }
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  disabled={testingGAS || !sheetsConfig.webAppUrl}
                  onClick={handleTestGAS}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {testingGAS ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  연결 테스트
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    testResult.ok
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {testResult.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              {/* Sync Actions */}
              {sheetsConfig.webAppUrl && (
                <div className="pt-3 border-t border-slate-200 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onSyncWithGAS}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    현재 명단을 구글 시트로 업로드 (Export)
                  </button>
                  <button
                    type="button"
                    onClick={onFetchFromGAS}
                    className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    구글 시트에서 명단 새로고침 (Import)
                  </button>
                </div>
              )}
            </div>

            {/* Guide Steps */}
            <div className="border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-extrabold text-slate-900 text-sm">
                  📖 구글 시트 & Apps Script 30초 설정 가이드
                </h4>
                <button
                  type="button"
                  onClick={handleCopyGASCode}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'Apps Script 코드 복사됨!' : 'Code.gs 스크립트 복사하기'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black inline-flex items-center justify-center text-[11px] mb-2">
                    1
                  </span>
                  <div className="font-bold text-slate-900">구글 시트 생성</div>
                  <p className="text-slate-500 mt-1">
                    새 구글 스프레드시트를 열고 상단 메뉴의 [확장 프로그램] → [Apps Script]를 클릭합니다.
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black inline-flex items-center justify-center text-[11px] mb-2">
                    2
                  </span>
                  <div className="font-bold text-slate-900">스크립트 붙여넣기</div>
                  <p className="text-slate-500 mt-1">
                    우측 상단 'Code.gs 스크립트 복사'를 누른 뒤 Apps Script 에디터에 붙여넣고 저장합니다.
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black inline-flex items-center justify-center text-[11px] mb-2">
                    3
                  </span>
                  <div className="font-bold text-slate-900">초기화 함수 실행</div>
                  <p className="text-slate-500 mt-1">
                    상단 실행 함수에서 <strong>setupSheets</strong>를 선택하고 [실행]을 누릅니다 (권한 허용).
                  </p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black inline-flex items-center justify-center text-[11px] mb-2">
                    4
                  </span>
                  <div className="font-bold text-slate-900">웹 앱 배포 및 등록</div>
                  <p className="text-slate-500 mt-1">
                    [배포] → [새 배포] → 유형 [웹 앱] 선택, 액세스 권한 <strong>'모든 사용자(Anyone)'</strong> 설정 후 URL 복사!
                  </p>
                </div>
              </div>

              {/* Code viewer */}
              <div className="mt-4">
                <details className="bg-slate-900 rounded-2xl p-4 text-slate-300 font-mono text-xs">
                  <summary className="font-sans font-bold text-white cursor-pointer hover:text-blue-300">
                    전체 Google Apps Script (Code.gs) 소스코드 확인하기
                  </summary>
                  <pre className="mt-3 overflow-x-auto p-2 bg-slate-950 rounded-xl text-slate-200 max-h-72">
                    {GOOGLE_APPS_SCRIPT_TEMPLATE}
                  </pre>
                </details>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 8. SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors max-w-2xl mx-auto space-y-4">
          <h3 className="font-extrabold text-slate-900 text-lg mb-1">
            ⚙️ 모임 기본 정보 설정
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            모임명, 부제목, 일시 및 장소를 변경하면 QR 안내 포스터와 모든 화면에 실시간 적용됩니다.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">모임명</label>
              <input
                type="text"
                value={eventConfig.title}
                onChange={(e) => onUpdateEventConfig({ ...eventConfig, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">부제목 / 설명</label>
              <input
                type="text"
                value={eventConfig.subtitle}
                onChange={(e) => onUpdateEventConfig({ ...eventConfig, subtitle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">모임 일시</label>
                <input
                  type="text"
                  value={eventConfig.date}
                  onChange={(e) => onUpdateEventConfig({ ...eventConfig, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">관리자 빠른 확인 PIN</label>
                <input
                  type="text"
                  value={eventConfig.adminPin}
                  onChange={(e) => onUpdateEventConfig({ ...eventConfig, adminPin: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">집결 및 탑승 장소</label>
              <input
                type="text"
                value={eventConfig.location}
                onChange={(e) => onUpdateEventConfig({ ...eventConfig, location: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT PARTICIPANT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingParticipant ? '참가자 정보 수정' : '새 참가자 직접 등록'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveParticipant} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">이름 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 홍길동"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  휴대폰 번호 * (뒷자리 4자리 자동 추출)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="예: 010-1234-5678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  신청 티셔츠 사이즈 *
                </label>
                <select
                  value={formData.tshirtSize}
                  onChange={(e) => setFormData({ ...formData, tshirtSize: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="S">S (90)</option>
                  <option value="M">M (95)</option>
                  <option value="L">L (100)</option>
                  <option value="XL">XL (105)</option>
                  <option value="2XL">2XL (110)</option>
                  <option value="3XL">3XL (115)</option>
                </select>
              </div>

              {/* Prize winner toggle */}
              <div className="pt-2 border-t border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={formData.isPrizeWinner}
                    onChange={(e) => setFormData({ ...formData, isPrizeWinner: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-slate-800">이벤트 당첨자로 지정</span>
                </label>

                {formData.isPrizeWinner && (
                  <div className="space-y-3 bg-amber-50 p-3 rounded-2xl border border-amber-200">
                    <div>
                      <label className="block text-xs font-bold text-amber-900 mb-1">
                        당첨 기념품 품목
                      </label>
                      <input
                        type="text"
                        placeholder="예: 한정판 사이클 져지"
                        value={formData.prizeItem || ''}
                        onChange={(e) => setFormData({ ...formData, prizeItem: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-amber-900 mb-1">
                        수령 지정 제휴 매장
                      </label>
                      <select
                        value={formData.prizeShop || '서울 bb5'}
                        onChange={(e) => setFormData({ ...formData, prizeShop: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300 text-xs focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="서울 bb5">서울 bb5 (강동구)</option>
                        <option value="부산 occ">부산 occ (광안리)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">비고 / 좌석 메모</label>
                <input
                  type="text"
                  placeholder="예: 1호차 15번 좌석"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-md cursor-pointer"
                >
                  {editingParticipant ? '수정 저장' : '등록 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
