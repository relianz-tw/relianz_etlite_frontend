'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { loadReferenceImages, loadSourceFiles, saveReferenceImages, saveSourceFiles, type SourceFile } from './referenceStorage';

interface ReferenceContextValue {
  /** 對照面板顯示的原件圖片（PDF 每頁一張） */
  images: File[];
  /** sourceId：圖片是從哪份上傳檔案轉出來的，刪除該檔案時圖片一併清掉 */
  setImages: (files: File[], sourceId?: string | null) => void;
  /** 營所稅使用者上傳的原始檔案，可多份，只有使用者手動刪除才會移除 */
  sourceFiles: SourceFile[];
  /** 新增一份上傳檔案，回傳它的 id */
  addSourceFile: (file: File) => string;
  /** 記下這份檔案辨識後帶入了哪些文件 */
  setSourceAppliedLabels: (id: string, labels: string[]) => void;
  removeSourceFile: (id: string) => void;
  /** 對照面板是否展開 */
  open: boolean;
  setOpen: (open: boolean) => void;
  /** 目前聚焦的欄位 fieldCode，面板依它查座標 */
  focusedField: string | null;
  setFocusedField: (fieldCode: string | null) => void;
}

const ReferenceContext = createContext<ReferenceContextValue | null>(null);

function newSourceId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ReferenceProvider({ children }: { children: ReactNode }) {
  const [images, setImagesState] = useState<File[]>([]);
  const [sourceFiles, setSourceFilesState] = useState<SourceFile[]>([]);
  const [open, setOpen] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  // 連續操作（新增後立刻寫辨識結果）時 state 還沒更新，用 ref 拿最新值
  const imagesRef = useRef<File[]>([]);
  const imagesSourceIdRef = useRef<string | null>(null);
  const sourceFilesRef = useRef<SourceFile[]>([]);

  const setImages = useCallback((files: File[], sourceId: string | null = null) => {
    imagesRef.current = files;
    imagesSourceIdRef.current = sourceId;
    setImagesState(files);
    saveReferenceImages({ files, sourceId });
  }, []);

  const commitSourceFiles = useCallback((next: SourceFile[]) => {
    sourceFilesRef.current = next;
    setSourceFilesState(next);
    saveSourceFiles(next);
  }, []);

  const addSourceFile = useCallback(
    (file: File) => {
      const id = newSourceId();
      commitSourceFiles([...sourceFilesRef.current, { id, file, appliedLabels: [] }]);
      return id;
    },
    [commitSourceFiles]
  );

  const setSourceAppliedLabels = useCallback(
    (id: string, labels: string[]) => commitSourceFiles(sourceFilesRef.current.map(s => (s.id === id ? { ...s, appliedLabels: labels } : s))),
    [commitSourceFiles]
  );

  const removeSourceFile = useCallback(
    (id: string) => {
      commitSourceFiles(sourceFilesRef.current.filter(s => s.id !== id));
      if (imagesSourceIdRef.current === id) setImages([], null);
    },
    [commitSourceFiles, setImages]
  );

  // 重新整理後從 IndexedDB 取回；若載入前使用者已經上傳新檔，以新檔為準
  useEffect(() => {
    loadReferenceImages().then(({ files, sourceId }) => {
      if (files.length === 0 || imagesRef.current.length > 0) return;
      imagesRef.current = files;
      imagesSourceIdRef.current = sourceId;
      setImagesState(files);
    });
    loadSourceFiles().then(files => {
      if (files.length === 0 || sourceFilesRef.current.length > 0) return;
      sourceFilesRef.current = files;
      setSourceFilesState(files);
    });
  }, []);

  const value = useMemo(
    () => ({ images, setImages, sourceFiles, addSourceFile, setSourceAppliedLabels, removeSourceFile, open, setOpen, focusedField, setFocusedField }),
    [images, setImages, sourceFiles, addSourceFile, setSourceAppliedLabels, removeSourceFile, open, focusedField]
  );
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
