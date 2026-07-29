'use client';

import { useSyncExternalStore } from 'react';
import type { ReconRecord, ReconSide } from './types';

/**
 * 沖帳紀錄的跨頁共用狀態：帳簿頁的「匯總沖帳」對話框寫入，對帳中心頁讀取顯示歷史紀錄。
 * 純前端 mock、無持久化，重新整理頁面即清空；以 module-level 狀態 + useSyncExternalStore 實作，
 * 避免僅為此需求引入額外的全域狀態管理套件或改動 root layout。
 */
let records: ReconRecord[] = [];
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return records;
}

function getServerSnapshot(): ReconRecord[] {
  return [];
}

export function addReconRecord(record: ReconRecord) {
  records = [record, ...records];
  emitChange();
}

export function useReconRecords(side: ReconSide): ReconRecord[] {
  const all = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return all.filter(r => r.side === side);
}
