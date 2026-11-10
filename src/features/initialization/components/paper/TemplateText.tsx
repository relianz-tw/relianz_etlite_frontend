'use client';

import { fmtCurrency } from '@/lib/utils';
import { ChoiceGroup } from './ChoiceGroup';
import { StoreFieldInput } from './FieldInput';
import { isFieldVisible, usePaperStore } from './PaperStore';

const TOKEN = /(\{\{(?:field|ref|group):[^}]+\}\})/g;

/**
 * 模板文字（labelTemplate、textBlocks）：{{field:X}} 嵌入輸入框、{{ref:X}} 顯示唯讀值、{{group:X}} 嵌入勾選框。
 * 對帳模式（沒有輸入）只顯示文字與 ref 值，輸入框改以 renderValue 或省略。
 */
export function TemplateText({ template }: { template: string }) {
  const store = usePaperStore();
  const { fieldMap, groupMap } = store.page;

  return (
    <>
      {template.split(TOKEN).map((part, i) => {
        const m = /^\{\{(field|ref|group):([^}]+)\}\}$/.exec(part);
        if (!m) return <span key={i}>{part}</span>;
        const [, kind, code] = m;
        if (kind === 'group') {
          const choice = groupMap[code];
          return choice ? <ChoiceGroup key={i} choice={choice} inline /> : null;
        }
        const field = fieldMap[code];
        if (!field) return null;
        if (kind === 'ref') {
          const raw = store.get(code).value;
          return (
            <span key={i} className='mx-1 font-bold tabular-nums'>
              {raw === '' ? '—' : field.type === 'money' ? fmtCurrency(Number(raw)) : String(raw)}
            </span>
          );
        }
        if (!isFieldVisible(field, store)) return null;
        // 輸入框嵌在文字中，固定寬度與文字基線對齊
        return (
          <span key={i} className='mx-1 inline-block w-36 align-middle'>
            <StoreFieldInput field={field} />
          </span>
        );
      })}
    </>
  );
}
