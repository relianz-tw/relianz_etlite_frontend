'use client';

import { fmtCurrency } from '@/lib/utils';
import type { ReportFieldDef } from '../../reports/types';
import { ChoiceGroup } from './ChoiceGroup';
import { StoreFieldInput } from './FieldInput';
import { isFieldVisible, usePaperStore } from './PaperStore';

/**
 * {{ref:X}}：開帳頁畫成輸入框（01 這類欄位值可能是 0 或辨識帶入，一律讓使用者能直接改）；
 * 對帳模式（沒有輸入）只顯示唯讀值，沒有值顯示「—」。
 */
function RefValue({ field }: { field: ReportFieldDef }) {
  const store = usePaperStore();
  if (!store.renderValue) {
    return (
      <span className='mx-0.5 inline-block w-36 align-middle'>
        <StoreFieldInput field={field} />
      </span>
    );
  }
  const raw = store.get(field.key).value;
  return <span className='mx-1 font-bold tabular-nums'>{raw === '' ? '—' : field.type === 'money' ? fmtCurrency(Number(raw)) : String(raw)}</span>;
}

const TOKEN = /(\{\{(?:field|ref|group):[^}]+\}\})/g;

/**
 * 模板文字（labelTemplate、textBlocks）：{{field:X}} 嵌入輸入框、{{ref:X}} 開帳頁畫成輸入框（對帳頁唯讀）、{{group:X}} 嵌入勾選框。
 * 對帳模式（沒有輸入）只顯示文字與 ref 值，輸入框改以 renderValue 或省略。
 */
export function TemplateText({ template }: { template: string }) {
  const store = usePaperStore();
  const { fieldMap, groupMap } = store.page;

  return (
    <>
      {template.split(TOKEN).map((part, i) => {
        const m = /^\{\{(field|ref|group):([^}]+)\}\}$/.exec(part);
        // 文字與行內的勾選框、輸入框都用 align-middle，才會落在同一條水平線上
        if (!m) return <span key={i} className='align-middle'>{part}</span>;
        const [, kind, code] = m;
        if (kind === 'group') {
          const choice = groupMap[code];
          return choice ? <ChoiceGroup key={i} choice={choice} inline /> : null;
        }
        const field = fieldMap[code];
        if (!field) return null;
        if (kind === 'ref') return <RefValue key={i} field={field} />;
        if (!isFieldVisible(field, store)) return null;
        // 輸入框嵌在文字中，固定寬度與文字基線對齊
        return (
          <span key={i} className='mx-0.5 inline-block w-36 align-middle'>
            <StoreFieldInput field={field} />
          </span>
        );
      })}
    </>
  );
}
