import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { EventConfig } from '../types';
import { QrCode, Download, Printer, ExternalLink, Bus, Shirt, Store, Check, Copy } from 'lucide-react';

interface QRCodeHubProps {
  eventConfig: EventConfig;
}

interface QRCardItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'checkin' | 'tshirt' | 'prize';
  urlParam: string;
  icon: React.ReactNode;
  accentColor: string;
}

export const QRCodeHub: React.FC<QRCodeHubProps> = ({ eventConfig }) => {
  const [qrImages, setQrImages] = useState<{ [key: string]: string }>({});
  const [selectedPoster, setSelectedPoster] = useState<QRCardItem | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';

  const qrItems: QRCardItem[] = [
    {
      id: 'qr-checkin',
      title: '🚌 버스 탑승 & 출석 체크 QR',
      subtitle: '출발 장소 및 버스 승차 안내대 비치용',
      category: 'checkin',
      urlParam: '?mode=checkin',
      icon: <Bus className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      accentColor: 'from-blue-600 to-indigo-600',
    },
    {
      id: 'qr-tshirt',
      title: '👕 기념 티셔츠 분출처 QR',
      subtitle: '기념품 배부처 및 본부석 테이블 비치용',
      category: 'tshirt',
      urlParam: '?mode=tshirt',
      icon: <Shirt className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      accentColor: 'from-indigo-600 to-violet-600',
    },
    {
      id: 'qr-shop-bb5',
      title: '🎁 서울 bb5 매장 수령처 QR',
      subtitle: '서울 강동구 천호동 bb5 매장 카운터 비치용',
      category: 'prize',
      urlParam: '?mode=prize&shop=bb5',
      icon: <Store className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      accentColor: 'from-amber-500 to-orange-500',
    },
    {
      id: 'qr-shop-occ',
      title: '🎁 부산 occ 매장 수령처 QR',
      subtitle: '부산 수영구 민락동 occ 매장 카운터 비치용',
      category: 'prize',
      urlParam: '?mode=prize&shop=occ',
      icon: <Store className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      accentColor: 'from-amber-600 to-amber-700',
    },
  ];

  useEffect(() => {
    const generateAll = async () => {
      const generated: { [key: string]: string } = {};
      for (const item of qrItems) {
        const fullUrl = `${baseUrl}${item.urlParam}`;
        try {
          const dataUrl = await QRCode.toDataURL(fullUrl, {
            width: 320,
            margin: 2,
            color: {
              dark: '#0f172a',
              light: '#ffffff',
            },
          });
          generated[item.id] = dataUrl;
        } catch (e) {
          console.error('QR generate error', e);
        }
      }
      setQrImages(generated);
    };

    generateAll();
  }, [baseUrl]);

  const handleDownload = (item: QRCardItem) => {
    const dataUrl = qrImages[item.id];
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${item.id}_${eventConfig.title.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  const handleCopy = (item: QRCardItem) => {
    const fullUrl = `${baseUrl}${item.urlParam}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(item.id);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handlePrint = (item: QRCardItem) => {
    setSelectedPoster(item);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-2">
              <QrCode className="w-3.5 h-3.5" />
              현장 비치용 공식 QR 코드 발급 허브
            </span>
            <h3 className="text-xl sm:text-2xl font-black">
              목적별 QR 코드 및 인쇄용 포스터
            </h3>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              스마트폰 기본 카메라로 QR 코드를 비추면 참가자 화면으로 즉시 연결됩니다.
              A4 안내 포스터를 바로 인쇄하거나 이미지 파일로 다운로드하세요.
            </p>
          </div>
        </div>
      </div>

      {/* QR Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {qrItems.map((item) => {
          const qrImg = qrImages[item.id];
          const fullUrl = `${baseUrl}${item.urlParam}`;
          return (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-all p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                    </div>
                  </div>
                </div>

                {/* QR Preview Box */}
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-200/80 dark:border-slate-700/80 mb-4">
                  {qrImg ? (
                    <img
                      src={qrImg}
                      alt={item.title}
                      className="w-44 h-44 rounded-xl shadow-sm bg-white p-2 border border-slate-200 dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs">
                      QR 생성 중...
                    </div>
                  )}
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-2 break-all text-center px-2 line-clamp-1">
                    {fullUrl}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownload(item)}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    PNG 다운로드
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrint(item)}
                    className="py-2.5 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    A4 안내문 인쇄
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(item)}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedUrl === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-600 dark:text-emerald-400">링크 복사됨!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        URL 주소 복사
                      </>
                    )}
                  </button>
                  <a
                    href={fullUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    title="새 탭에서 테스트 열기"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hidden Print Container specifically formatted for A4 Paper Print */}
      {selectedPoster && (
        <div id="print-poster-container" className="hidden print:block fixed inset-0 bg-white p-8 z-50 text-black">
          <div className="max-w-xl mx-auto border-4 border-slate-900 rounded-3xl p-10 text-center flex flex-col items-center justify-between min-h-[90vh]">
            <div>
              <span className="text-base font-bold text-slate-500 uppercase tracking-widest">
                {eventConfig.subtitle}
              </span>
              <h1 className="text-3xl font-black text-slate-950 mt-1 mb-2">
                {eventConfig.title}
              </h1>
              <div className="text-sm font-semibold text-slate-700">
                일시: {eventConfig.date} | 장소: {eventConfig.location}
              </div>
            </div>

            <div className="my-8 flex flex-col items-center">
              <div className="p-3 bg-white border-4 border-slate-900 rounded-3xl shadow-xl">
                {qrImages[selectedPoster.id] && (
                  <img
                    src={qrImages[selectedPoster.id]}
                    alt={selectedPoster.title}
                    className="w-72 h-72"
                  />
                )}
              </div>
              <h2 className="text-2xl font-black text-slate-900 mt-6">
                {selectedPoster.title}
              </h2>
              <p className="text-base text-slate-700 font-bold mt-2 max-w-md">
                스마트폰 카메라로 QR 코드를 스캔하신 후,<br />
                본인 휴대폰 번호 <span className="underline decoration-4">뒷자리 4자리</span>를 입력해 주세요.
              </p>
            </div>

            <div className="text-xs text-slate-400 border-t border-slate-200 pt-4 w-full">
              모임 QR 출석부 & 티셔츠 분출 관리 시스템 • 주최 운영본부
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
