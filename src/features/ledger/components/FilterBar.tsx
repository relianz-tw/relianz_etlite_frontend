'use client';

import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import { ChevronDown, Plus, Search, Upload } from 'lucide-react';
import type { Side } from '../types';

export default function FilterBar({ side }: { side: Side }) {
  return (
    <>
      {/* 桌機 */}
      <div className="hidden flex-col gap-3 nav:flex">
        <div className="flex items-center gap-2.5">
          {side === 'sales' && (
            <Select widthClassName="flex-[2]">
              <option>交易期間：114/01/01 – 115/01/01</option>
              <option>本月</option>
              <option>本季</option>
              <option>本年度</option>
            </Select>
          )}
          <Button variant="outline" icon={Upload} className="flex-1">
            匯入電子發票
          </Button>
          <Button variant="warm" icon={Plus} className="flex-1">
            新增交易
          </Button>
        </div>
        <div className="flex items-center gap-2.5">
          <Select widthClassName="w-32">
            <option>交易編號</option>
            <option>發票號碼</option>
            <option>統一編號</option>
          </Select>
          <div className="flex-1">
            <TextInput placeholder="請輸入要查詢的發票號碼" />
          </div>
          <Button variant="primary" icon={Search}>
            搜尋
          </Button>
          <Button variant="ghost" icon={ChevronDown} iconPosition="right">
            進階搜尋
          </Button>
        </div>
      </div>

      {/* 手機 */}
      <div className="flex flex-col gap-3 nav:hidden">
        <div className="flex gap-2.5">
          <Button variant="outline" icon={Upload} className="flex-1">
            匯入電子發票
          </Button>
          <Button variant="primary" icon={Plus} className="flex-1">
            新增交易
          </Button>
        </div>
        <TextInput placeholder="搜尋發票號碼、公司或金額" />
      </div>
    </>
  );
}
