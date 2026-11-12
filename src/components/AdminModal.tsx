import React, { useState } from 'react';
import { useLottery } from '../context/LotteryContext';
import {
  X,
  Sliders,
  History,
  RotateCcw,
  Download,
  AlertTriangle,
  CheckCircle,
  Hash,
  CloudCheck
} from 'lucide-react';
import { fireCelebrationFireworks } from '../utils/confetti';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const {
    settings,
    updateSettings,
    history,
    resetAll,
    resetPrize,
    prizes,
    formatNumber,
    getAllActiveWinnerNumbers,
    getAvailableNumbers
  } = useLottery();

  const [activeTab, setActiveTab] = useState<'numbers' | 'history' | 'reset'>('numbers');

  const [tempStart, setTempStart] = useState(settings.startNumber);
  const [tempEnd, setTempEnd] = useState(settings.endNumber);
  const [tempExcluded, setTempExcluded] = useState(settings.excludedNumbers.join(', '));
  const [saveSuccess, setSaveSuccess] = useState(false);

  // In-app confirmation dialog for Admin reset actions
  const [adminConfirm, setAdminConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  if (!isOpen) return null;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedStart = parseInt(String(tempStart), 10) || 1;
    const parsedEnd = parseInt(String(tempEnd), 10) || 125;

    if (parsedStart > parsedEnd) {
      alert('시작 번호는 종료 번호보다 작거나 같아야 합니다.');
      return;
    }

    const parsedExcluded = tempExcluded
      .split(/[,\s]+/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= parsedStart && n <= parsedEnd);

    updateSettings({
      startNumber: parsedStart,
      endNumber: parsedEnd,
      excludedNumbers: parsedExcluded
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExportCSV = () => {
    if (history.length === 0) {
      showNotification('기록된 당첨 내역이 없습니다.');
      return;
    }

    const headers = ['추첨시각', '경품구분', '슬롯번호', '당첨번호', '상태', '비고'];
    const rows = history.map((item) => [
      `"${item.drawnAt}"`,
      `"${item.prizeName}"`,
      `"#${item.slotIndex + 1}"`,
      `"${formatNumber(item.number)}"`,
      `"${item.status === 'active' ? '정상당첨' : '재추첨됨'}"`,
      `"${item.reason || ''}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `수원시장애인종합복지관_경품추첨결과_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeWinners = getAllActiveWinnerNumbers();
  const availablePool = getAvailableNumbers();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white border-2 border-amber-300 rounded-3xl p-5 sm:p-7 shadow-2xl text-slate-800 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header (No password needed, staff direct access!) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-300">
              <Sliders className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  행사 관리자 모드 (직원 전용)
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
                  파이어베이스 클라우드 동기화
                </span>
              </div>
              <p className="text-xs text-slate-500">추첨 번호 세팅 변경, 당첨 기록 확인 및 원클릭 리셋</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="my-2 p-2.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold animate-fade-in">
            {notification}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 py-3">
          <button
            onClick={() => setActiveTab('numbers')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              activeTab === 'numbers'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>추첨 번호 세팅</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4" />
            <span>당첨 번호 기록 ({history.length}건)</span>
          </button>

          <button
            onClick={() => setActiveTab('reset')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              activeTab === 'reset'
                ? 'bg-rose-100 text-rose-900 border border-rose-300'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>리셋 및 초기화</span>
          </button>
        </div>

        {/* Tab 1: Number Settings */}
        {activeTab === 'numbers' && (
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200">
                  <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-amber-700" /> 시작 번호 (기본: 1)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="9999"
                    value={tempStart}
                    onChange={(e) => setTempStart(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono text-base font-black"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    화면 표시: {formatNumber(tempStart)}번
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200">
                  <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-amber-700" /> 종료 번호 (기본: 125)
                  </label>
                  <input
                    type="number"
                    min={tempStart}
                    max="9999"
                    value={tempEnd}
                    onChange={(e) => setTempEnd(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-mono text-base font-black"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    화면 표시: {formatNumber(tempEnd)}번 (총 {tempEnd - tempStart + 1}명 대상)
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  제외 번호 (쉼표로 구분 예: 13, 24, 77)
                </label>
                <input
                  type="text"
                  value={tempExcluded}
                  onChange={(e) => setTempExcluded(e.target.value)}
                  placeholder="예: 7, 13, 45 (결석자나 미배부 티켓)"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm font-mono"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  추첨 대상에서 완전히 제외할 번호를 지정할 수 있습니다.
                </span>
              </div>

              {/* Summary of Current Pool */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-600">설정된 전체 인원: </span>
                  <strong className="text-slate-900 font-bold">
                    {settings.endNumber - settings.startNumber + 1}명
                  </strong>
                </div>
                <div>
                  <span className="text-slate-600">이미 당첨된 인원: </span>
                  <strong className="text-rose-600 font-bold">{activeWinners.length}명</strong>
                </div>
                <div>
                  <span className="text-slate-600">현재 추첨 가능 번호: </span>
                  <strong className="text-emerald-700 font-bold">{availablePool.length}개</strong>
                </div>
              </div>

              {saveSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-1.5 font-bold">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>추첨 번호 세팅이 성공적으로 저장 및 클라우드 동기화되었습니다!</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTempStart(1);
                    setTempEnd(125);
                    setTempExcluded('');
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  기본값 복원 (001~125)
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-sm"
                >
                  설정 저장하기
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Winning History Log */}
        {activeTab === 'history' && (
          <div className="flex-1 flex flex-col overflow-hidden py-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500 font-semibold">
                전체 당첨 이력 및 재추첨 로그 ({history.length}건)
              </span>
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>엑셀(CSV) 다운로드</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl bg-white shadow-inner">
              {history.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-slate-400 text-xs">
                  기록된 당첨 내역이 없습니다.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] sticky top-0 border-b border-slate-200 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">추첨 시각</th>
                      <th className="py-2.5 px-3">경품명</th>
                      <th className="py-2.5 px-3">슬롯</th>
                      <th className="py-2.5 px-3">당첨 번호</th>
                      <th className="py-2.5 px-3">상태</th>
                      <th className="py-2.5 px-3">비고</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {history.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-500">{item.drawnAt}</td>
                        <td className="py-2 px-3 font-sans font-bold text-slate-900">{item.prizeName}</td>
                        <td className="py-2 px-3 text-slate-500">#{item.slotIndex + 1}</td>
                        <td className="py-2 px-3 font-black text-amber-900 text-sm">
                          {formatNumber(item.number)}
                        </td>
                        <td className="py-2 px-3">
                          {item.status === 'active' ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-sans font-bold">
                              정상 당첨
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-sans font-bold">
                              재추첨 완료
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-500 text-[11px] font-sans">
                          {item.reason || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Reset Options (100% functional with in-app confirm) */}
        {activeTab === 'reset' && (
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200">
              <h4 className="text-sm font-bold text-slate-900 mb-1">개별 경품 초기화 (리셋)</h4>
              <p className="text-xs text-slate-500 mb-3">
                특정 경품의 당첨 번호만 비우고 다시 처음부터 추첨할 수 있도록 리셋합니다.
              </p>
              <div className="flex flex-wrap gap-2">
                {prizes.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setAdminConfirm({
                        isOpen: true,
                        title: `'${p.name}' (${p.count}명) 결과 초기화`,
                        message: `'${p.name}'의 기존 당첨 결과를 초기화하시겠습니까?`,
                        onConfirm: () => {
                          resetPrize(p.id);
                          showNotification(`'${p.name}' 결과가 성공적으로 리셋되었습니다.`);
                        }
                      });
                    }}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-amber-100 text-slate-800 border-2 border-amber-300 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    {p.name} ({p.count}명) 리셋
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>전체 경품 및 당첨 기록 완전 초기화</span>
              </div>
              <p className="text-xs text-rose-600/80 mb-3">
                모든 경품(경품 8명, 헤어드라이기 1명, 밥솥 1명)의 당첨 결과와 모든 당첨 기록을 완전히 삭제하고 행사를 처음부터 다시 시작합니다.
              </p>
              <button
                type="button"
                onClick={() => {
                  setAdminConfirm({
                    isOpen: true,
                    title: '전체 데이터 완전 초기화',
                    message:
                      '정말로 모든 경품 추첨 기록과 당첨 데이터를 삭제하시겠습니까? 파이어베이스 클라우드에도 즉시 반영됩니다.',
                    onConfirm: () => {
                      resetAll();
                      showNotification('전체 경품 추첨 데이터가 완전히 초기화되었습니다.');
                    }
                  });
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition-all shadow-md shadow-rose-600/30 cursor-pointer active:scale-95"
              >
                전체 데이터 완전 리셋 실행
              </button>
            </div>

            {/* Test Fireworks button */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">무대 축하 폭죽 연출 테스트</h4>
                <p className="text-xs text-slate-500">화면 폭죽 애니메이션을 미리 시연해봅니다.</p>
              </div>
              <button
                type="button"
                onClick={() => fireCelebrationFireworks()}
                className="px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold cursor-pointer"
              >
                폭죽 테스트
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Admin In-App Confirmation Modal */}
      {adminConfirm.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-sm bg-white border-2 border-amber-400 rounded-3xl p-6 shadow-2xl text-slate-800">
            <h3 className="text-base font-black text-slate-900 mb-2 font-dohyeon">
              {adminConfirm.title}
            </h3>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed font-medium">
              {adminConfirm.message}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdminConfirm((prev) => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  adminConfirm.onConfirm();
                  setAdminConfirm((prev) => ({ ...prev, isOpen: false }));
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                확인, 실행
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
