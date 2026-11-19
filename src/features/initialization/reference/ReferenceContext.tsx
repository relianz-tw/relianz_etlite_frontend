'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadReferenceImages, saveReferenceImages } from './referenceImagesStorage';

interface ReferenceContextValue {
  /** 使用者最近上傳的申報書轉成的每頁圖片（僅存記憶體，重新整理後消失） */
  images: File[];
  setImages: (files: File[]) => void;
  /** 對照面板是否展開 */
  open: boolean;
  setOpen: (open: boolean) => void;
  /** 目前聚焦的欄位 fieldCode，面板依它查座標 */
  focusedField: string | null;
  setFocusedField: (fieldCode: string | null) => void;
}

const ReferenceContext = createContext<ReferenceContextValue | null>(null);

export function ReferenceProvider({ children }: { children: ReactNode }) {
  const [images, setImagesState] = useState<File[]>([]);
  const [open, setOpen] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // 重新整理後從 IndexedDB 取回上次的對照圖片；若載入前使用者已經上傳新檔，以新檔為準
  useEffect(() => {
    loadReferenceImages().then(files => {
      if (files.length > 0) setImagesState(prev => (prev.length > 0 ? prev : files));
    });
  }, []);

  const setImages = useCallback((files: File[]) => {
    setImagesState(files);
    saveReferenceImages(files);
  }, []);

  const value = useMemo(() => ({ images, setImages, open, setOpen, focusedField, setFocusedField }), [images, setImages, open, focusedField]);
  return <ReferenceContext.Provider value={value}>{children}</ReferenceContext.Provider>;
}

/** 必須在 ReferenceProvider 內使用（開帳精靈） */
export function useReference(): ReferenceContextValue {
  const ctx = useContext(ReferenceContext);
  if (!ctx) throw new Error('useReference 必須在 ReferenceProvider 內使用');
  return ctx;
}

/** 可在 Provider 外使用（如申報對帳頁共用 PaperForm 時沒有對照面板），沒有 Provider 回傳 null */
export function useReferenceOptional(): ReferenceContextValue | null {
  return useContext(ReferenceContext);
}
