'use client';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Pagination from '@/components/ui/Pagination';
import Select from '@/components/ui/Select';
import TextInput from '@/components/ui/TextInput';
import { ChevronLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { deleteEmployee, listEmployees } from './mockStore';

const PAGE_SIZE = 10;

type StatusFilter = 'all' | 'active' | 'inactive';

export default function EmployeeListView() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const employees = useMemo(() => {
    void refreshTick;
    return listEmployees();
  }, [refreshTick]);

  const filtered = employees.filter(e => {
    if (status !== 'all' && e.status !== status) return false;
    if (!query.trim()) return true;
    const q = query.trim();
    return e.name.includes(q) || e.idNumber.includes(q) || e.phoneNumber.includes(q) || e.email.includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteEmployee(deleteTarget.id);
    setRefreshTick(t => t + 1);
  };

  return (
    <div className="min-h-screen bg-surface-off-white">
      <div className="mx-auto max-w-[1200px] px-4 pt-4 pb-7 nav:px-7 nav:pt-7">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/withholding/salary" className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-mid hover:bg-surface-cream hover:text-neutral-dark">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="font-notoSerif text-[22px] font-semibold tracking-tight text-neutral-dark">員工列表</h1>
            <p className="mt-0.5 text-sm text-neutral-mid">維護薪資明細所需的員工基本資料與投保級距</p>
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-2 nav:flex-row">
          <div className="flex-1">
            <TextInput
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="搜尋員工（姓名、身分證字號、電話、Email）"
            />
          </div>
          <div className="w-full nav:w-40">
            <Select
              widthClassName="w-full"
              value={status}
              onValueChange={v => {
                setStatus(v as StatusFilter);
                setPage(1);
              }}
            >
              <option value="all">全部員工</option>
              <option value="active">在職員工</option>
              <option value="inactive">離職員工</option>
            </Select>
          </div>
          <Link href="/withholding/salary/employee/new" className="inline-flex">
            <Button icon={Plus} className="w-full nav:w-auto">
              新增員工
            </Button>
          </Link>
        </div>

        <div className="hidden overflow-hidden rounded-md border border-neutral-blue-gray/30 bg-white nav:block">
          <table className="w-full border-collapse">
            <thead className="bg-surface-off-white">
              <tr className="border-b border-neutral-blue-gray/40">
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-neutral-mid">狀態</th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-neutral-mid">就職日期</th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-neutral-mid">職稱</th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-neutral-mid">姓名</th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-neutral-mid">身分證字號</th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-neutral-mid">電話</th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-neutral-mid">Email</th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-neutral-mid">操作</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-neutral-mid">
                    無符合條件的員工資料
                  </td>
                </tr>
              ) : (
                pageRows.map((e, i) => (
                  <tr key={e.id} className={`border-b border-neutral-blue-gray/20 last:border-0 hover:bg-brand-blue/5 ${i % 2 === 1 ? 'bg-surface-warm/30' : ''}`}>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm">
                      <Badge tone={e.status === 'active' ? 'success' : 'neutral'}>{e.status === 'active' ? '在職' : '離職'}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-neutral-dark">{e.onboardDate}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-neutral-dark">{e.jobTitle}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-neutral-dark">
                      <span className="flex items-center gap-1.5">
                        {e.name}
                        {e.isHead && <Badge tone="info">負責人</Badge>}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-sm text-neutral-mid">{e.idNumber}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-neutral-dark">{e.phoneNumber}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-neutral-dark">{e.email}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm">
                      <div className="flex gap-2">
                        <Link href={`/withholding/salary/employee/${e.id}`} className="inline-flex">
                          <Button size="sm" variant="outline" icon={Pencil}>
                            編輯
                          </Button>
                        </Link>
                        <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setDeleteTarget({ id: e.id, name: e.name })} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 nav:hidden">
          {pageRows.length === 0 ? (
            <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">無符合條件的員工資料</div>
          ) : (
            pageRows.map(e => (
              <div key={e.id} className="rounded-lg border border-neutral-blue-gray/30 bg-white p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-semibold text-neutral-dark">
                    {e.name}
                    {e.isHead && <Badge tone="info">負責人</Badge>}
                  </span>
                  <Badge tone={e.status === 'active' ? 'success' : 'neutral'}>{e.status === 'active' ? '在職' : '離職'}</Badge>
                </div>
                <div className="space-y-1 text-sm text-neutral-mid">
                  <p>職稱：{e.jobTitle}</p>
                  <p>身分證字號：{e.idNumber}</p>
                  <p>電話：{e.phoneNumber}</p>
                  <p>Email：{e.email}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link href={`/withholding/salary/employee/${e.id}`} className="flex-1">
                    <Button size="sm" variant="outline" icon={Pencil} className="w-full">
                      編輯
                    </Button>
                  </Link>
                  <Button size="sm" variant="ghost" icon={Trash2} onClick={() => setDeleteTarget({ id: e.id, name: e.name })} />
                </div>
              </div>
            ))
          )}
        </div>

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="確認刪除此員工？"
        message={
          <>
            確定要刪除員工 <span className="font-semibold">{deleteTarget?.name}</span> 嗎？此操作無法復原。
          </>
        }
      />
    </div>
  );
}
