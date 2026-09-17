'use client';

import { Dialog, DialogContent } from '@/components/ui/Dialog';
import {
  INVOICE_TEMPLATES,
  type InvoiceTemplate,
  cropImageToFile,
} from '@/lib/imageCrop';
import { Loader2, Minus, Plus, RotateCcw, RotateCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { toast } from 'sonner';

interface InvoiceCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 要裁切的來源圖片（不含 PDF） */
  sourceFile: File | null;
  /** 裁切確認後回傳裁切後的 File 與 base64 preview */
  onConfirm: (croppedFile: File, croppedPreview: string) => void;
  /** 點擊「重新上傳」時呼叫 */
  onReupload?: () => void;
  defaultTemplateId?: InvoiceTemplate['id'];
  /** AI 辨識回傳的旋轉角度，自動套用至裁切器 */
  defaultRotation?: number;
  /** AI 辨識是否進行中 */
  isAnalyzing?: boolean;
  /** 限制可選的模板清單；未傳入時顯示全部 */
  allowedTemplateIds?: InvoiceTemplate['id'][];
}

export function InvoiceCropDialog({
  open,
  onOpenChange,
  sourceFile,
  onConfirm,
  onReupload,
  defaultTemplateId = 'handwritten',
  defaultRotation,
  isAnalyzing = false,
  allowedTemplateIds,
}: InvoiceCropDialogProps) {
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<InvoiceTemplate['id']>(defaultTemplateId);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [zoomInput, setZoomInput] = useState('100');
  const [rotation, setRotation] = useState(0);
  const [rotationInput, setRotationInput] = useState('0');
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  // 記住 AI 辨識的版型（使用者換選後仍保留，用於重新展開時排序）
  const [aiTemplateMemo, setAiTemplateMemo] = useState<
    InvoiceTemplate['id'] | null
  >(null);
  // 手機版型選擇器是否展開
  const [isPickerExpanded, setIsPickerExpanded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const visibleTemplates = allowedTemplateIds
    ? INVOICE_TEMPLATES.filter(t => allowedTemplateIds.includes(t.id))
    : INVOICE_TEMPLATES;

  const selectedTemplate =
    visibleTemplates.find(t => t.id === selectedTemplateId) ??
    visibleTemplates[0];

  // 展開選擇器時，AI 推薦版型排在第一
  const orderedTemplates = useMemo(() => {
    if (!aiTemplateMemo) return visibleTemplates;
    const ai = visibleTemplates.find(t => t.id === aiTemplateMemo);
    if (!ai) return visibleTemplates;
    return [ai, ...visibleTemplates.filter(t => t.id !== aiTemplateMemo)];
  }, [visibleTemplates, aiTemplateMemo]);

  // 建立 / 釋放 blob URL
  useEffect(() => {
    if (!sourceFile) return;
    const url = URL.createObjectURL(sourceFile);
    setImageUrl(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setZoomInput('100');
    setRotation(0);
    setRotationInput('0');
    setCroppedAreaPixels(null);
    return () => URL.revokeObjectURL(url);
  }, [sourceFile]);

  // 對話框開啟時重置模板與手機選擇器狀態
  useEffect(() => {
    if (open) {
      setSelectedTemplateId(defaultTemplateId);
      setAiTemplateMemo(null);
      setIsPickerExpanded(false);
    }
  }, [open, defaultTemplateId]);

  // AI 辨識完成後自動套用旋轉角度
  useEffect(() => {
    if (defaultRotation !== undefined && defaultRotation !== null) {
      setRotation(defaultRotation);
      setRotationInput(String(defaultRotation));
    }
  }, [defaultRotation]);

  // 辨識完成時記下 AI 推薦版型（只記一次，使用者換選後不覆蓋）
  useEffect(() => {
    if (!isAnalyzing && aiTemplateMemo === null && defaultTemplateId) {
      setAiTemplateMemo(defaultTemplateId);
    }
  }, [isAnalyzing, defaultTemplateId, aiTemplateMemo]);

  // 觀察裁切容器尺寸（用於 SVG overlay）
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const onFreeCropComplete = useCallback((area: Area) => {
    setCroppedAreaPixels(area);
  }, []);

  const handleTemplateChange = (id: InvoiceTemplate['id']) => {
    setSelectedTemplateId(id);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setZoomInput('100');
  };

  const rotateHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rotateHoldIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const startRotating = (step: number) => {
    const apply = () => {
      setRotation(prev => {
        // 取模讓角度在 0–359° 循環，避免超出範圍後卡住
        const next = (((prev + step) % 360) + 360) % 360;
        setRotationInput(String(next));
        return next;
      });
    };
    apply();
    rotateHoldTimerRef.current = setTimeout(() => {
      rotateHoldIntervalRef.current = setInterval(apply, 120);
    }, 400);
  };

  const stopRotating = () => {
    if (rotateHoldTimerRef.current) {
      clearTimeout(rotateHoldTimerRef.current);
      rotateHoldTimerRef.current = null;
    }
    if (rotateHoldIntervalRef.current) {
      clearInterval(rotateHoldIntervalRef.current);
      rotateHoldIntervalRef.current = null;
    }
  };

  // 元件卸載時清理計時器
  useEffect(() => () => stopRotating(), []);

  const handleExport = async () => {
    if (!croppedAreaPixels || !sourceFile) return;
    setIsExporting(true);
    try {
      const { file, preview } = await cropImageToFile(
        sourceFile,
        croppedAreaPixels,
        rotation,
        `invoice_${Date.now()}.jpg`
      );
      onConfirm(file, preview);
      onOpenChange(false);
    } catch {
      toast.error('圖片裁切失敗，請重試');
    } finally {
      setIsExporting(false);
    }
  };

  // 計算裁切框螢幕座標（用於 SVG overlay，自由裁切時不顯示）
  const aspect = selectedTemplate.aspect;
  const { width: cW, height: cH } = containerSize;
  let boxW = 0,
    boxH = 0;
  if (aspect !== null && cW > 0 && cH > 0) {
    if (cW / cH > aspect) {
      boxH = cH;
      boxW = cH * aspect;
    } else {
      boxW = cW;
      boxH = cW / aspect;
    }
  }
  const boxX = (cW - boxW) / 2;
  const boxY = (cH - boxH) / 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={event => {
          // 避免 Radix 預設將焦點移到發票類型清單的第一個按鈕（手開發票及收據），
          // 造成瀏覽器焦點外框與實際辨識選中的版型同時顯示
          event.preventDefault();
        }}
        className='left-0 right-0 translate-x-0 w-full h-[100dvh] md:h-[680px] md:left-[50%] md:right-auto md:-translate-x-1/2 md:max-w-5xl p-0 overflow-hidden flex flex-col [&>button]:z-20 [&>button]:text-white/80 [&>button]:hover:text-white [&>button]:md:text-[#6B6560] [&>button]:md:hover:text-neutral-dark'
      >
        <div className='flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden'>
          {/* 左側：圖片 + 縮放列 */}
          <div className='flex flex-col flex-1 min-h-0 md:flex-1 md:shrink'>
            {/* 圖片區域 */}
            <div
              ref={containerRef}
              className='relative bg-neutral-dark flex-1 min-h-0'
            >
              {imageUrl ? (
                aspect === null ? (
                  <FreeCropView
                    key={imageUrl}
                    imageUrl={imageUrl}
                    onCropComplete={onFreeCropComplete}
                    rotation={rotation}
                  />
                ) : (
                  <>
                    <Cropper
                      image={imageUrl}
                      crop={crop}
                      zoom={zoom}
                      rotation={rotation}
                      aspect={aspect ?? undefined}
                      minZoom={0.5}
                      maxZoom={3}
                      onCropChange={setCrop}
                      onZoomChange={v => {
                        setZoom(v);
                        setZoomInput(String(Math.round(v * 100)));
                      }}
                      onCropComplete={onCropComplete}
                      restrictPosition={zoom >= 1}
                      style={{
                        containerStyle: { background: '#3A3830' },
                        cropAreaStyle:
                          aspect === null
                            ? { border: 'none', boxShadow: 'none' }
                            : { border: '2.5px solid #00AAFF' },
                      }}
                    />
                    {/* SVG overlay：四角標記 + 尺寸標籤 */}
                    {boxW > 0 && boxH > 0 && (
                      <svg
                        style={{
                          position: 'absolute',
                          left: boxX,
                          top: boxY,
                          width: boxW,
                          height: boxH,
                          pointerEvents: 'none',
                          zIndex: 10,
                        }}
                      >
                        {[
                          [0, 0, 16, 0, 0, 16],
                          [boxW - 16, 0, boxW, 0, boxW, 16],
                          [0, boxH - 16, 0, boxH, 16, boxH],
                          [boxW - 16, boxH, boxW, boxH, boxW, boxH - 16],
                        ].map((pts, i) => (
                          <polyline
                            key={i}
                            points={`${pts[0]},${pts[1]} ${pts[2]},${pts[3]} ${pts[4]},${pts[5]}`}
                            fill='none'
                            stroke='#00AAFF'
                            strokeWidth='3'
                          />
                        ))}
                        <rect
                          x={boxW / 2 - 54}
                          y={8}
                          width={108}
                          height={22}
                          rx={4}
                          fill='rgba(0,0,0,0.45)'
                        />
                        <text
                          x={boxW / 2}
                          y={24}
                          textAnchor='middle'
                          fill='white'
                          fontSize='11'
                          fontFamily='sans-serif'
                        >
                          {selectedTemplate.spec}
                        </text>
                      </svg>
                    )}
                  </>
                )
              ) : (
                <div className='flex items-center justify-center h-full text-[#888] text-sm'>
                  請選擇圖片
                </div>
              )}
              {/* AI 辨識中遮罩 */}
              {isAnalyzing && (
                <div className='absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-neutral-dark'>
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt=''
                      className='absolute inset-0 w-full h-full object-contain opacity-20 pointer-events-none'
                    />
                  )}
                  <Loader2
                    size={28}
                    className='animate-spin text-white relative z-10'
                  />
                  <p className='text-sm text-white font-medium relative z-10'>
                    AI 辨識中，請稍候…
                  </p>
                </div>
              )}
            </div>
            {/* 桌機縮放列（位於圖片下方，不覆蓋圖片） */}
            {!isAnalyzing && imageUrl && aspect !== null && (
              <div className='hidden md:flex items-center gap-2 bg-[#2A2820] px-4 py-2 shrink-0'>
                <button
                  onClick={() => {
                    const v = Math.max(50, Math.round(zoom * 100) - 10);
                    setZoom(v / 100);
                    setZoomInput(String(v));
                  }}
                  className='text-white/70 hover:text-white shrink-0'
                >
                  <Minus size={14} />
                </button>
                <div className='flex-1'>
                  <SliderInput
                    min={50}
                    max={300}
                    value={Math.round(zoom * 100)}
                    onChange={v => {
                      setZoom(v / 100);
                      setZoomInput(String(v));
                    }}
                    dark
                  />
                </div>
                <button
                  onClick={() => {
                    const v = Math.min(300, Math.round(zoom * 100) + 10);
                    setZoom(v / 100);
                    setZoomInput(String(v));
                  }}
                  className='text-white/70 hover:text-white shrink-0'
                >
                  <Plus size={14} />
                </button>
                <div className='flex items-center gap-0.5 shrink-0'>
                  <input
                    type='text'
                    inputMode='numeric'
                    value={zoomInput}
                    onChange={e => {
                      setZoomInput(e.target.value);
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v))
                        setZoom(Math.max(0.5, Math.min(3, v / 100)));
                    }}
                    onBlur={() => {
                      const v = parseInt(zoomInput, 10);
                      const clamped = isNaN(v)
                        ? 100
                        : Math.max(50, Math.min(300, v));
                      setZoom(clamped / 100);
                      setZoomInput(String(clamped));
                    }}
                    className='text-xs text-white w-7 text-right tabular-nums bg-transparent border-b border-transparent focus:border-white/60 focus:outline-none'
                  />
                  <span className='text-xs text-white/80'>%</span>
                </div>
              </div>
            )}
            {/* 手機縮放列（位於圖片下方，不覆蓋圖片） */}
            {!isAnalyzing && imageUrl && aspect !== null && (
              <div className='md:hidden flex items-center gap-2 bg-[#2A2820] px-3 py-2 shrink-0'>
                <button
                  onClick={() => {
                    const v = Math.max(50, Math.round(zoom * 100) - 10);
                    setZoom(v / 100);
                    setZoomInput(String(v));
                  }}
                  className='text-white/70 active:text-white shrink-0'
                >
                  <Minus size={14} />
                </button>
                <div className='flex-1'>
                  <SliderInput
                    min={50}
                    max={300}
                    value={Math.round(zoom * 100)}
                    onChange={v => {
                      setZoom(v / 100);
                      setZoomInput(String(v));
                    }}
                    dark
                  />
                </div>
                <button
                  onClick={() => {
                    const v = Math.min(300, Math.round(zoom * 100) + 10);
                    setZoom(v / 100);
                    setZoomInput(String(v));
                  }}
                  className='text-white/70 active:text-white shrink-0'
                >
                  <Plus size={14} />
                </button>
                <span className='text-xs text-white/80 shrink-0 w-9 text-right tabular-nums'>
                  {Math.round(zoom * 100)}%
                </span>
              </div>
            )}
            {/* 手機旋轉列（位於縮放列下方，不覆蓋圖片） */}
            {!isAnalyzing && imageUrl && (
              <div className='md:hidden flex items-center gap-2 bg-[#2A2820] px-3 pb-3 pt-1 shrink-0'>
                <button
                  onPointerDown={() => startRotating(-90)}
                  onPointerUp={stopRotating}
                  onPointerLeave={stopRotating}
                  className='h-10 flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-white/90 text-sm text-neutral-dark active:bg-white transition-colors select-none'
                >
                  <RotateCcw size={13} />
                  往左轉
                </button>
                <div className='h-10 w-12 shrink-0 flex items-center justify-center bg-black/40 rounded-lg text-white text-xs tabular-nums'>
                  {rotation}°
                </div>
                <button
                  onPointerDown={() => startRotating(90)}
                  onPointerUp={stopRotating}
                  onPointerLeave={stopRotating}
                  className='h-10 flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-white/90 text-sm text-neutral-dark active:bg-white transition-colors select-none'
                >
                  <RotateCw size={13} />
                  往右轉
                </button>
              </div>
            )}
          </div>
          {/* 左側 wrapper 結束 */}

          {/* 右側控制面板（手機版在下方） */}
          <div className='w-full md:w-72 shrink-0 flex flex-col gap-2 md:gap-4 px-3 pt-2 pb-0 md:px-4 md:py-4 bg-surface-off-white border-t md:border-t-0 md:border-l border-[#E0DAD6] overflow-y-auto'>
            {/* 發票類型（辨識中時呈 disabled 樣式） */}
            <section
              className={isAnalyzing ? 'pointer-events-none opacity-40' : ''}
            >
              {/* 桌機標題 */}
              <h3 className='hidden md:block text-sm font-semibold text-neutral-dark mb-1'>
                發票類型
              </h3>
              <p className='hidden md:block text-xs text-[#8A8478] mb-2'>
                選擇版型後，可拖曳照片將憑證對齊方框
              </p>
              {/* 手機：collapsed / expanded 雙模式 */}
              <div className='md:hidden'>
                <h3 className='text-sm font-semibold text-neutral-dark mb-2'>
                  發票類型
                </h3>
                {isPickerExpanded ? (
                  <div className='flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 scrollbar-none'>
                    {orderedTemplates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => {
                          handleTemplateChange(template.id);
                          setIsPickerExpanded(false);
                        }}
                        className={`flex flex-row items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors cursor-pointer shrink-0 h-[52px] ${
                          selectedTemplateId === template.id
                            ? 'border-brand-blue bg-white text-brand-blue'
                            : 'border-[#D4CEC9] bg-white text-neutral-dark'
                        }`}
                      >
                        <TemplateIcon
                          id={template.id}
                          selected={selectedTemplateId === template.id}
                        />
                        <span className='whitespace-nowrap leading-tight'>
                          {template.label}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className='flex gap-2'>
                    <button
                      onClick={() => setIsPickerExpanded(true)}
                      className='flex flex-row items-center gap-2 rounded-lg border border-brand-blue bg-white text-brand-blue px-3 h-[52px] text-xs shrink-0'
                    >
                      <TemplateIcon id={selectedTemplate.id} selected={true} />
                      <span className='whitespace-nowrap leading-tight'>
                        {selectedTemplate.label}
                      </span>
                    </button>
                    <button
                      onClick={() => setIsPickerExpanded(true)}
                      className='flex-1 h-[52px] inline-flex items-center justify-center rounded-lg text-neutral-dark text-xs border border-[#D4CEC9]'
                    >
                      選擇其他發票類型
                    </button>
                  </div>
                )}
              </div>
              {/* 桌機：2 欄格子 */}
              <div className='hidden md:grid grid-cols-2 gap-2'>
                {visibleTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateChange(template.id)}
                    className={`flex flex-col items-center rounded-lg border p-2 text-xs transition-colors cursor-pointer h-24 ${
                      selectedTemplateId === template.id
                        ? 'border-brand-blue bg-white text-brand-blue'
                        : 'border-[#D4CEC9] bg-white text-neutral-dark hover:border-brand-blue'
                    }`}
                  >
                    <div className='flex-1 flex items-center justify-center'>
                      <TemplateIcon
                        id={template.id}
                        selected={selectedTemplateId === template.id}
                      />
                    </div>
                    <span className='text-center leading-tight'>
                      {template.label}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* 調整（桌機專用，辨識中時呈 disabled 樣式） */}
            <section
              className={`hidden md:block ${
                isAnalyzing ? 'pointer-events-none opacity-40' : ''
              }`}
            >
              <div className='mb-3'>
                <h3 className='text-sm font-semibold text-neutral-dark'>調整</h3>
              </div>
              <div className='flex flex-col gap-3'>
                {/* 旋轉滑桿 */}
                <div className='flex items-center gap-2'>
                  <span className='text-xs text-[#6B6560] w-8 shrink-0'>
                    旋轉
                  </span>
                  <SliderInput
                    min={-360}
                    max={360}
                    value={rotation}
                    onChange={v => {
                      setRotation(v);
                      setRotationInput(String(v));
                    }}
                  />
                  <div className='flex items-center w-14 shrink-0 justify-end gap-0.5'>
                    <input
                      type='text'
                      inputMode='numeric'
                      value={rotationInput}
                      onChange={e => {
                        setRotationInput(e.target.value);
                        const v = parseInt(e.target.value, 10);
                        if (!isNaN(v))
                          setRotation(Math.max(-360, Math.min(360, v)));
                      }}
                      onBlur={() => {
                        const v = parseInt(rotationInput, 10);
                        const normalized = isNaN(v)
                          ? 0
                          : ((v % 360) + 360) % 360;
                        setRotation(normalized);
                        setRotationInput(String(normalized));
                      }}
                      className='text-xs text-neutral-dark w-10 text-right tabular-nums bg-transparent border-b border-transparent focus:border-brand-blue focus:outline-none'
                    />
                    <span className='text-xs text-neutral-dark'>°</span>
                  </div>
                </div>
                {/* 旋轉快速按鈕（支援長按持續旋轉） */}
                <div className='flex gap-2'>
                  <button
                    onPointerDown={() => startRotating(-90)}
                    onPointerUp={stopRotating}
                    onPointerLeave={stopRotating}
                    className='flex-1 flex items-center justify-center gap-1 rounded border border-[#D4CEC9] bg-white text-xs text-neutral-dark py-1.5 hover:border-brand-blue hover:text-brand-blue active:bg-[#EBF4FB] transition-colors select-none'
                  >
                    <RotateCcw size={13} />
                    往左轉
                  </button>
                  <button
                    onPointerDown={() => startRotating(90)}
                    onPointerUp={stopRotating}
                    onPointerLeave={stopRotating}
                    className='flex-1 flex items-center justify-center gap-1 rounded border border-[#D4CEC9] bg-white text-xs text-neutral-dark py-1.5 hover:border-brand-blue hover:text-brand-blue active:bg-[#EBF4FB] transition-colors select-none'
                  >
                    <RotateCw size={13} />
                    往右轉
                  </button>
                </div>
              </div>
            </section>

            {/* 彈性空間（桌機） */}
            <div className='hidden md:flex flex-1' />

            {/* 操作按鈕（辨識中時呈 disabled 樣式） */}
            <div
              className={`pt-2 border-t border-[#E0DAD6] flex gap-2 ${
                isAnalyzing ? 'pointer-events-none opacity-40' : ''
              }`}
              style={{
                paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
              }}
            >
              {onReupload && (
                <button
                  onClick={onReupload}
                  disabled={isAnalyzing}
                  className='flex-1 inline-flex items-center justify-center rounded-lg font-medium border border-[#D4CEC9] bg-white text-neutral-dark hover:border-brand-blue hover:text-brand-blue hover:bg-white h-[52px] md:h-8 text-sm md:text-xs'
                >
                  重新上傳
                </button>
              )}
              <button
                onClick={handleExport}
                disabled={!imageUrl || isExporting || isAnalyzing}
                className={`inline-flex items-center justify-center rounded-lg font-medium bg-brand-blue text-white hover:bg-brand-blue-dark border-0 disabled:opacity-50 h-[52px] md:h-8 text-sm md:text-xs ${
                  onReupload ? 'flex-1' : 'w-full'
                }`}
              >
                {isExporting ? '處理中…' : '確認'}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── 自由裁切元件 ──────────────────────────────────────────────

function FreeCropView({
  imageUrl,
  onCropComplete,
  rotation = 0,
}: {
  imageUrl: string;
  onCropComplete: (area: Area) => void;
  rotation?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // 裁切框以旋轉後 bounding box 的百分比儲存（0–100），resize 時自動適應
  const [cropPct, setCropPct] = useState({ x: 10, y: 10, w: 80, h: 80 });
  // 旋轉後 bounding box 在容器內的位置與尺寸（px）
  const [imgRect, setImgRect] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const imgRectRef = useRef(imgRect);
  imgRectRef.current = imgRect;

  // 旋轉後自然像素尺寸（供座標換算用）
  const rotNatRef = useRef({ w: 0, h: 0 });

  const dragRef = useRef<{
    handle: 'move' | 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
    startX: number;
    startY: number;
    startCrop: typeof cropPct;
  } | null>(null);

  // 依旋轉角度計算 bounding box，並更新圖片顯示矩形
  const measureImage = useCallback(() => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container || !img.naturalWidth) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const W = img.naturalWidth;
    const H = img.naturalHeight;
    const rad = (rotation * Math.PI) / 180;
    const sinA = Math.abs(Math.sin(rad));
    const cosA = Math.abs(Math.cos(rad));
    const rotW = W * cosA + H * sinA;
    const rotH = W * sinA + H * cosA;
    rotNatRef.current = { w: rotW, h: rotH };
    const ratio = rotW / rotH;
    let bboxW: number, bboxH: number;
    if (cw / ch > ratio) {
      bboxH = ch;
      bboxW = ch * ratio;
    } else {
      bboxW = cw;
      bboxH = cw / ratio;
    }
    setImgRect({
      x: (cw - bboxW) / 2,
      y: (ch - bboxH) / 2,
      w: bboxW,
      h: bboxH,
    });
  }, [rotation]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(measureImage);
    ro.observe(container);
    return () => ro.disconnect();
  }, [measureImage]);

  // 旋轉角度變更時重新測量並重置裁切框
  useEffect(() => {
    setCropPct({ x: 10, y: 10, w: 80, h: 80 });
    measureImage();
  }, [rotation, measureImage]);

  // 通知父層裁切像素座標（以旋轉後自然像素空間計算）
  useEffect(() => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth || imgRect.w === 0) return;
    const { w: rotNatW, h: rotNatH } = rotNatRef.current;
    onCropComplete({
      x: (cropPct.x / 100) * rotNatW,
      y: (cropPct.y / 100) * rotNatH,
      width: (cropPct.w / 100) * rotNatW,
      height: (cropPct.h / 100) * rotNatH,
    });
  }, [cropPct, imgRect.w, onCropComplete]);

  const startDrag = (
    e: React.MouseEvent | React.TouchEvent,
    handle: NonNullable<typeof dragRef.current>['handle']
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const pt = 'touches' in e ? e.touches[0] : e;
    dragRef.current = {
      handle,
      startX: pt.clientX,
      startY: pt.clientY,
      startCrop: { ...cropPct },
    };
  };

  useEffect(() => {
    const MIN = 5; // 最小 5%
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragRef.current) return;
      const pt =
        'touches' in e ? (e as TouchEvent).touches[0] : (e as MouseEvent);
      const ir = imgRectRef.current;
      if (ir.w === 0) return;
      const dx = ((pt.clientX - dragRef.current.startX) / ir.w) * 100;
      const dy = ((pt.clientY - dragRef.current.startY) / ir.h) * 100;
      const sc = dragRef.current.startCrop;
      let { x, y, w, h } = sc;
      const { handle } = dragRef.current;
      if (handle === 'move') {
        x = Math.max(0, Math.min(100 - w, sc.x + dx));
        y = Math.max(0, Math.min(100 - h, sc.y + dy));
      } else if (handle === 'e') {
        w = Math.max(MIN, Math.min(100 - sc.x, sc.w + dx));
      } else if (handle === 'w') {
        const nx = Math.max(0, Math.min(sc.x + sc.w - MIN, sc.x + dx));
        w = sc.x + sc.w - nx;
        x = nx;
      } else if (handle === 's') {
        h = Math.max(MIN, Math.min(100 - sc.y, sc.h + dy));
      } else if (handle === 'n') {
        const ny = Math.max(0, Math.min(sc.y + sc.h - MIN, sc.y + dy));
        h = sc.y + sc.h - ny;
        y = ny;
      } else if (handle === 'se') {
        w = Math.max(MIN, Math.min(100 - sc.x, sc.w + dx));
        h = Math.max(MIN, Math.min(100 - sc.y, sc.h + dy));
      } else if (handle === 'sw') {
        const nx = Math.max(0, Math.min(sc.x + sc.w - MIN, sc.x + dx));
        w = sc.x + sc.w - nx;
        x = nx;
        h = Math.max(MIN, Math.min(100 - sc.y, sc.h + dy));
      } else if (handle === 'ne') {
        w = Math.max(MIN, Math.min(100 - sc.x, sc.w + dx));
        const ny = Math.max(0, Math.min(sc.y + sc.h - MIN, sc.y + dy));
        h = sc.y + sc.h - ny;
        y = ny;
      } else if (handle === 'nw') {
        const nx = Math.max(0, Math.min(sc.x + sc.w - MIN, sc.x + dx));
        w = sc.x + sc.w - nx;
        x = nx;
        const ny = Math.max(0, Math.min(sc.y + sc.h - MIN, sc.y + dy));
        h = sc.y + sc.h - ny;
        y = ny;
      }
      setCropPct({ x, y, w, h });
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  // 將裁切框百分比轉換為容器絕對座標（含 letterbox 偏移）
  const bL = imgRect.x + (cropPct.x / 100) * imgRect.w;
  const bT = imgRect.y + (cropPct.y / 100) * imgRect.h;
  const bW = (cropPct.w / 100) * imgRect.w;
  const bH = (cropPct.h / 100) * imgRect.h;
  const H = 8; // 控點尺寸 px
  const hs = H / 2;

  const handles: [
    NonNullable<typeof dragRef.current>['handle'],
    number,
    number,
    string,
  ][] = [
    ['nw', bL - hs, bT - hs, 'nw-resize'],
    ['n', bL + bW / 2 - hs, bT - hs, 'n-resize'],
    ['ne', bL + bW - hs, bT - hs, 'ne-resize'],
    ['w', bL - hs, bT + bH / 2 - hs, 'w-resize'],
    ['e', bL + bW - hs, bT + bH / 2 - hs, 'e-resize'],
    ['sw', bL - hs, bT + bH - hs, 'sw-resize'],
    ['s', bL + bW / 2 - hs, bT + bH - hs, 's-resize'],
    ['se', bL + bW - hs, bT + bH - hs, 'se-resize'],
  ];

  return (
    <div
      ref={containerRef}
      className='relative w-full h-full bg-neutral-dark select-none overflow-hidden'
    >
      <img
        ref={imgRef}
        src={imageUrl}
        alt=''
        onLoad={measureImage}
        draggable={false}
        className='absolute pointer-events-none'
        style={(() => {
          const img = imgRef.current;
          if (!img || !img.naturalWidth || imgRect.w === 0) {
            return {
              left: imgRect.x,
              top: imgRect.y,
              width: imgRect.w,
              height: imgRect.h,
            };
          }
          const { w: rotNatW } = rotNatRef.current;
          const scale = rotNatW > 0 ? imgRect.w / rotNatW : 1;
          const displayW = img.naturalWidth * scale;
          const displayH = img.naturalHeight * scale;
          return {
            left: imgRect.x + (imgRect.w - displayW) / 2,
            top: imgRect.y + (imgRect.h - displayH) / 2,
            width: displayW,
            height: displayH,
            transform: `rotate(${rotation}deg)`,
            transformOrigin: 'center',
          };
        })()}
      />
      {imgRect.w > 0 && (
        <>
          {/* 裁切框外的半透明遮罩（4 塊） */}
          {[
            // 上
            {
              left: imgRect.x,
              top: imgRect.y,
              width: imgRect.w,
              height: (cropPct.y / 100) * imgRect.h,
            },
            // 下
            {
              left: imgRect.x,
              top: bT + bH,
              width: imgRect.w,
              height: imgRect.h - (cropPct.y / 100) * imgRect.h - bH,
            },
            // 左
            {
              left: imgRect.x,
              top: bT,
              width: (cropPct.x / 100) * imgRect.w,
              height: bH,
            },
            // 右
            {
              left: bL + bW,
              top: bT,
              width: imgRect.w - (cropPct.x / 100) * imgRect.w - bW,
              height: bH,
            },
          ].map((s, i) => (
            <div
              key={i}
              className='absolute bg-black/50 pointer-events-none'
              style={s}
            />
          ))}
          {/* 裁切邊框 */}
          <div
            className='absolute border border-[rgba(0,95,162,0.9)] pointer-events-none box-border'
            style={{ left: bL, top: bT, width: bW, height: bH }}
          >
            {/* 三等分格線 */}
            {[1, 2].map(n => (
              <div
                key={`v${n}`}
                className='absolute top-0 bottom-0 w-px bg-white/25'
                style={{ left: `${(n / 3) * 100}%` }}
              />
            ))}
            {[1, 2].map(n => (
              <div
                key={`h${n}`}
                className='absolute left-0 right-0 h-px bg-white/25'
                style={{ top: `${(n / 3) * 100}%` }}
              />
            ))}
          </div>
          {/* 移動整個裁切框 */}
          <div
            className='absolute cursor-move'
            style={{ left: bL, top: bT, width: bW, height: bH }}
            onMouseDown={e => startDrag(e, 'move')}
            onTouchStart={e => startDrag(e, 'move')}
          />
          {/* 8 個調整控點 */}
          {handles.map(([handle, l, t, cursor]) => (
            <div
              key={handle}
              className='absolute bg-white border border-brand-blue rounded-sm z-10'
              style={{ left: l, top: t, width: H, height: H, cursor }}
              onMouseDown={e => startDrag(e, handle)}
              onTouchStart={e => startDrag(e, handle)}
            />
          ))}
        </>
      )}
    </div>
  );
}

// ── 模板縮圖圖示 ──────────────────────────────────────────────

function TemplateIcon({
  id,
  selected,
}: {
  id: InvoiceTemplate['id'];
  selected: boolean;
}) {
  const stroke = selected ? '#005FA2' : '#B0A9A3';
  const fill = selected ? '#EBF4FB' : '#F5F3F2';

  if (id === 'handwritten') {
    return (
      <svg width='40' height='28' viewBox='0 0 40 28' fill='none'>
        <rect
          x='1'
          y='1'
          width='38'
          height='26'
          rx='2'
          fill={fill}
          stroke={stroke}
          strokeWidth='1.5'
        />
        <line x1='6' y1='9' x2='34' y2='9' stroke={stroke} strokeWidth='1' />
        <line x1='6' y1='14' x2='34' y2='14' stroke={stroke} strokeWidth='1' />
        <line x1='6' y1='19' x2='28' y2='19' stroke={stroke} strokeWidth='1' />
      </svg>
    );
  }
  if (id === 'a4') {
    return (
      <svg width='24' height='34' viewBox='0 0 24 34' fill='none'>
        <rect
          x='1'
          y='1'
          width='22'
          height='32'
          rx='2'
          fill={fill}
          stroke={stroke}
          strokeWidth='1.5'
        />
        <line x1='4' y1='9' x2='20' y2='9' stroke={stroke} strokeWidth='1' />
        <line x1='4' y1='15' x2='20' y2='15' stroke={stroke} strokeWidth='1' />
        <line x1='4' y1='21' x2='20' y2='21' stroke={stroke} strokeWidth='1' />
        <line x1='4' y1='27' x2='14' y2='27' stroke={stroke} strokeWidth='1' />
      </svg>
    );
  }
  if (id === 'short-eInvoice') {
    return (
      <svg width='22' height='40' viewBox='0 0 22 40' fill='none'>
        <rect
          x='1'
          y='1'
          width='20'
          height='38'
          rx='2'
          fill={fill}
          stroke={stroke}
          strokeWidth='1.5'
        />
        <line x1='4' y1='10' x2='18' y2='10' stroke={stroke} strokeWidth='1' />
        <line x1='4' y1='17' x2='18' y2='17' stroke={stroke} strokeWidth='1' />
        <line x1='4' y1='24' x2='18' y2='24' stroke={stroke} strokeWidth='1' />
        <line x1='4' y1='31' x2='14' y2='31' stroke={stroke} strokeWidth='1' />
      </svg>
    );
  }
  if (id === 'long-receipt') {
    return (
      <svg width='16' height='40' viewBox='0 0 16 40' fill='none'>
        <rect
          x='1'
          y='1'
          width='14'
          height='38'
          rx='2'
          fill={fill}
          stroke={stroke}
          strokeWidth='1.5'
        />
        <line x1='3' y1='8' x2='13' y2='8' stroke={stroke} strokeWidth='1' />
        <line x1='3' y1='14' x2='13' y2='14' stroke={stroke} strokeWidth='1' />
        <line x1='3' y1='20' x2='13' y2='20' stroke={stroke} strokeWidth='1' />
        <line x1='3' y1='26' x2='13' y2='26' stroke={stroke} strokeWidth='1' />
        <line x1='3' y1='32' x2='10' y2='32' stroke={stroke} strokeWidth='1' />
      </svg>
    );
  }
  if (id === 'boarding-pass') {
    // 登機證：橫式長條，含飛機圖示與鋸齒撕線
    return (
      <svg width='42' height='20' viewBox='0 0 42 20' fill='none'>
        <rect
          x='1'
          y='1'
          width='40'
          height='18'
          rx='2'
          fill={fill}
          stroke={stroke}
          strokeWidth='1.5'
        />
        {/* 鋸齒撕線 */}
        <line
          x1='29'
          y1='1'
          x2='29'
          y2='19'
          stroke={stroke}
          strokeWidth='1'
          strokeDasharray='2 2'
        />
        {/* 飛機 */}
        <path d='M8 10 L16 7 L14 10 L16 13 Z' fill={stroke} opacity='0.7' />
        <line
          x1='10'
          y1='10'
          x2='26'
          y2='10'
          stroke={stroke}
          strokeWidth='1'
          opacity='0.5'
        />
        {/* 右側條碼區 */}
        <line x1='31' y1='4' x2='31' y2='16' stroke={stroke} strokeWidth='1' />
        <line
          x1='33'
          y1='4'
          x2='33'
          y2='16'
          stroke={stroke}
          strokeWidth='1.5'
        />
        <line x1='35' y1='4' x2='35' y2='16' stroke={stroke} strokeWidth='1' />
        <line x1='37' y1='4' x2='37' y2='16' stroke={stroke} strokeWidth='2' />
        <line x1='39' y1='4' x2='39' y2='16' stroke={stroke} strokeWidth='1' />
      </svg>
    );
  }
  if (id === 'hsr-ticket') {
    // 高鐵票：橫式，含高鐵車廂外形
    return (
      <svg width='36' height='22' viewBox='0 0 36 22' fill='none'>
        <rect
          x='1'
          y='1'
          width='34'
          height='20'
          rx='2'
          fill={fill}
          stroke={stroke}
          strokeWidth='1.5'
        />
        {/* 車廂外形 */}
        <path
          d='M5 14 Q5 10 9 10 L27 10 Q31 10 31 14'
          stroke={stroke}
          strokeWidth='1.2'
          fill='none'
        />
        {/* 車窗 */}
        <rect
          x='10'
          y='11'
          width='4'
          height='3'
          rx='1'
          fill={stroke}
          opacity='0.4'
        />
        <rect
          x='16'
          y='11'
          width='4'
          height='3'
          rx='1'
          fill={stroke}
          opacity='0.4'
        />
        <rect
          x='22'
          y='11'
          width='4'
          height='3'
          rx='1'
          fill={stroke}
          opacity='0.4'
        />
        {/* 文字資訊區 */}
        <line x1='4' y1='6' x2='20' y2='6' stroke={stroke} strokeWidth='1' />
        <line x1='22' y1='6' x2='32' y2='6' stroke={stroke} strokeWidth='1' />
      </svg>
    );
  }
  // 其他（自由裁切）：虛線框 + 四角標記
  return (
    <svg width='34' height='34' viewBox='0 0 34 34' fill='none'>
      <rect
        x='1'
        y='1'
        width='32'
        height='32'
        rx='2'
        fill={fill}
        stroke={stroke}
        strokeWidth='1.5'
        strokeDasharray='4 3'
      />
      {/* 四角標記 */}
      <polyline
        points='1,9 1,1 9,1'
        stroke={stroke}
        strokeWidth='2'
        fill='none'
      />
      <polyline
        points='25,1 33,1 33,9'
        stroke={stroke}
        strokeWidth='2'
        fill='none'
      />
      <polyline
        points='1,25 1,33 9,33'
        stroke={stroke}
        strokeWidth='2'
        fill='none'
      />
      <polyline
        points='25,33 33,33 33,25'
        stroke={stroke}
        strokeWidth='2'
        fill='none'
      />
    </svg>
  );
}

// ── 系統風格滑桿 ──────────────────────────────────────────────

function SliderInput({
  min,
  max,
  value,
  onChange,
  dark = false,
}: {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  dark?: boolean;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className='relative flex-1 flex items-center h-8'>
      <div
        className={`absolute inset-x-0 h-1 rounded-full ${
          dark ? 'bg-white/25' : 'bg-[#E0DAD6]'
        }`}
      />
      <div
        className={`absolute left-0 h-1 rounded-full ${
          dark ? 'bg-white' : 'bg-brand-blue'
        }`}
        style={{ width: `${pct}%` }}
      />
      <input
        type='range'
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={`relative w-full h-1 appearance-none bg-transparent cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:border-2
          [&::-webkit-slider-thumb]:shadow-sm
          [&::-webkit-slider-thumb]:transition-transform
          [&::-webkit-slider-thumb]:hover:scale-110
          [&::-moz-range-thumb]:w-4
          [&::-moz-range-thumb]:h-4
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:border-2
          [&::-moz-range-thumb]:border-solid
          ${
            dark
              ? '[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-white/50 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-white/50'
              : '[&::-webkit-slider-thumb]:bg-brand-blue [&::-webkit-slider-thumb]:border-white [&::-moz-range-thumb]:bg-brand-blue [&::-moz-range-thumb]:border-white'
          }`}
      />
    </div>
  );
}
