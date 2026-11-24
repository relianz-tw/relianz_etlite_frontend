'use client';

import { deleteDraftFile, downloadDraftFile, listDraftFiles, uploadDraftFile } from '@/api/initializationDraft';
import { blobToFile } from '@/lib/blobToFile';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

/** 營所稅使用者上傳的原件（可多份）；id 為後端的 fileId，上傳失敗時是暫時 id、只存在記憶體 */
export interface SourceFile {
  id: string;
  file: File;
  /** false = 沒有成功存到後端，重新整理後會消失 */
  synced: boolean;
}

interface ReferenceContextValue {
  /** 營所稅使用者上傳的原件，依上傳順序，只有使用者手動刪除才會移除 */
  sourceFiles: SourceFile[];
  /** 上傳一份原件到後端並加進列表；上傳失敗時仍會加進列表（只在記憶體），error 帶失敗原因讓呼叫端提示 */
  addSourceFile: (file: File) => Promise<{ id: string; error?: unknown }>;
  /** 先刪後端、成功才從列表移除；後端刪除失敗會 throw，列表維持原樣 */
  removeSourceFile: (id: string) => Promise<void>;
  /** 對照面板是否展開 */
  open: boolean;
  /** 使用者按按鈕展開／收合；按過之後自動展開就不再覆寫他的選擇 */
  toggleOpen: (open: boolean) => void;
  /** 進入有辨識文件的頁面時自動展開；使用者手動操作過就不動 */
  autoOpen: (should: boolean) => void;
  /** 目前聚焦的欄位 fieldCode，面板依它查座標 */
  focusedField: string | null;
  setFocusedField: (fieldCode: string | null) => void;
}

const ReferenceContext = createContext<ReferenceContextValue | null>(null);

function newTempId(): string {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ReferenceProvider({ children }: { children: ReactNode }) {
  const [sourceFiles, setSourceFiles] = useState<SourceFile[]>([]);
  const [open, setOpen] = useState(false);
  // 使用者手動展開／收合過沒有：有的話自動展開就不再插手，免得他收起來後換頁又被打開
  const userToggledRef = useRef(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const toggleOpen = useCallback((next: boolean) => {
    userToggledRef.current = true;
    setOpen(next);
  }, []);

  const autoOpen = useCallback((should: boolean) => {
    if (!userToggledRef.current) setOpen(should);
  }, []);

  // 連續操作時 state 還沒更新，用 ref 拿最新列表
  const sourceFilesRef = useRef<SourceFile[]>([]);

  const commit = useCallback((next: SourceFile[]) => {
    sourceFilesRef.current = next;
    setSourceFiles(next);
  }, []);

  const addSourceFile = useCallback(
    async (file: File) => {
      try {
        const meta = await uploadDraftFile(file, 'REPORT_SOURCE');
        commit([...sourceFilesRef.current, { id: meta.fileId, file, synced: true }]);
        return { id: meta.fileId };
      } catch (error) {
        const id = newTempId();
        commit([...sourceFilesRef.current, { id, file, synced: false }]);
        return { id, error };
      }
    },
    [commit]
  );

  const removeSourceFile = useCallback(
    async (id: string) => {
      const target = sourceFilesRef.current.find(s => s.id === id);
      if (target?.synced) await deleteDraftFile(id);
      commit(sourceFilesRef.current.filter(s => s.id !== id));
    },
    [commit]
  );

  // 進入開帳頁（含換裝置、重新整理）時，從後端取回已上傳的營所稅原件；失敗就當沒有，不影響填表
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const metas = (await listDraftFiles().catch(() => [])).filter(m => m.kind === 'REPORT_SOURCE');
      const loaded = await Promise.all(
        metas.map(async (meta): Promise<SourceFile | null> => {
          try {
            const blob = await downloadDraftFile(meta.fileId);
            return { id: meta.fileId, file: blobToFile(blob, meta.fileName), synced: true };
          } catch {
            return null;
          }
        })
      );
      if (cancelled) return;
      // 取回期間使用者若已經上傳新檔，保留新檔，只補上列表裡還沒有的
      const existing = new Set(sourceFilesRef.current.map(s => s.id));
      const restored = loaded.filter((s): s is SourceFile => s !== null && !existing.has(s.id));
      if (restored.length > 0) commit([...restored, ...sourceFilesRef.current]);
    })();
    return () => {
      cancelled = true;
    };
  }, [commit]);

  const value = useMemo(
    () => ({ sourceFiles, addSourceFile, removeSourceFile, open, toggleOpen, autoOpen, focusedField, setFocusedField }),
    [sourceFiles, addSourceFile, removeSourceFile, open, toggleOpen, autoOpen, focusedField]
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
