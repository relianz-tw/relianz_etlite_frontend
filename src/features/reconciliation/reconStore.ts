'use client';

import { useMemo, useSyncExternalStore } from 'react';
import type { ReconRecord, ReconSide } from './types';

/**
 * 沖帳紀錄與結餘的跨頁共用狀態：匯總沖帳頁寫入，對帳中心頁讀取顯示歷史紀錄。
 * 純前端 mock、無持久化，重新整理頁面即清空；以 module-level 狀態 + useSyncExternalStore 實作，
 * 避免僅為此需求引入額外的全域狀態管理套件或改動 root layout。
 * 三份狀態（沖帳紀錄／結餘／手動歸類）各自使用獨立的 getSnapshot：useSyncExternalStore 只有在
 * 該 hook 自己的 getSnapshot 回傳值改變時才會觸發重渲染，若共用同一個 getSnapshot（例如都回傳
 * records），emitChange() 通知到但該次操作未改動 records 本身時就不會重渲染，是真的會漏更新的陷阱。
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

function getRecordsSnapshot() {
  return records;
}

// 回傳固定的空陣列參照（而非每次呼叫都建立新陣列），避免 useSyncExternalStore 在 hydration 階段
// 因 getServerSnapshot 每次回傳不同參照而發出 "should be cached to avoid an infinite loop" 警告
const EMPTY_RECORDS: ReconRecord[] = [];
function getRecordsServerSnapshot(): ReconRecord[] {
  return EMPTY_RECORDS;
}

export function addReconRecord(record: ReconRecord) {
  records = [record, ...records];
  emitChange();
}

export function useReconRecords(side: ReconSide): ReconRecord[] {
  const all = useSyncExternalStore(subscribe, getRecordsSnapshot, getRecordsServerSnapshot);
  return all.filter(r => r.side === side);
}

/**
 * 沖帳金額多於待沖帳款時，使用者可選擇將餘額留到下次同管道／廠商沖帳使用。
 * 以「side::groupKey」為鍵記錄結餘金額，供下次進入該群組時自動併入可沖銷總額（pool）。
 */
type CarryOverKey = `${ReconSide}::${string}`;
let carryOverMap: Record<CarryOverKey, number> = {};
const EMPTY_CARRY_OVER: Record<string, number> = {};

function carryOverKey(side: ReconSide, groupKey: string): CarryOverKey {
  return `${side}::${groupKey}`;
}

function getCarryOverSnapshot() {
  return carryOverMap;
}

function getCarryOverServerSnapshot() {
  return EMPTY_CARRY_OVER;
}

export function getCarryOverAmount(side: ReconSide, groupKey: string): number {
  return carryOverMap[carryOverKey(side, groupKey)] ?? 0;
}

export function addCarryOver(side: ReconSide, groupKey: string, amount: number) {
  const key = carryOverKey(side, groupKey);
  carryOverMap = { ...carryOverMap, [key]: (carryOverMap[key] ?? 0) + amount };
  emitChange();
}

/** 沖帳送出時，先清掉本次已帶入使用的上次結餘，避免與新寫入的結餘重複疊加 */
export function consumeCarryOver(side: ReconSide, groupKey: string) {
  const key = carryOverKey(side, groupKey);
  if (!(key in carryOverMap)) return;
  const next = { ...carryOverMap };
  delete next[key];
  carryOverMap = next;
  emitChange();
}

export function useCarryOver(side: ReconSide, groupKey: string | null): number {
  useSyncExternalStore(subscribe, getCarryOverSnapshot, getCarryOverServerSnapshot);
  return groupKey ? getCarryOverAmount(side, groupKey) : 0;
}

/**
 * 「其他」交易的手動歸類覆寫：後端目前無編輯單筆交易管道／廠商的 API（同 LedgerTable 既有的
 * channelOverrides 作法，純前端 state），以「side::交易id」為鍵記錄使用者指定的管道／廠商名稱。
 */
let reassignMap: Record<string, string> = {};
const EMPTY_REASSIGN: Record<string, string> = {};

function reassignKey(side: ReconSide, txnId: string): string {
  return `${side}::${txnId}`;
}

function getReassignSnapshot() {
  return reassignMap;
}

function getReassignServerSnapshot() {
  return EMPTY_REASSIGN;
}

export function setReassignedGroup(side: ReconSide, txnId: string, groupKey: string) {
  reassignMap = { ...reassignMap, [reassignKey(side, txnId)]: groupKey };
  emitChange();
}

export function useReassignMap(side: ReconSide): Record<string, string> {
  const raw = useSyncExternalStore(subscribe, getReassignSnapshot, getReassignServerSnapshot);
  return useMemo(() => {
    const prefix = `${side}::`;
    const result: Record<string, string> = {};
    Object.entries(raw).forEach(([key, value]) => {
      if (key.startsWith(prefix)) result[key.slice(prefix.length)] = value;
    });
    return result;
  }, [raw, side]);
}
