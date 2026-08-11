'use client';

import { createChannelRule, listChannelRules, updateChannelRule } from '@/api/channelRules';
import type { ChannelRuleDto } from '@/api/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { CirclePlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { BankAccountRecord, ChannelRuleRecord } from '../data';
import { formatSettlement } from '../data';
import ChannelRuleDialog from './ChannelRuleDialog';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';

interface ChannelRuleSectionProps {
  /** 收款帳戶下拉選項與表格解析用，僅傳入啟用中的實際銀行帳戶 */
  accounts: BankAccountRecord[];
}

/** 後端 ChannelRuleDto 轉為畫面用的 ChannelRuleRecord */
function toChannelRuleRecord(dto: ChannelRuleDto): ChannelRuleRecord {
  return {
    id: dto.channelUuid,
    channelName: dto.channelName ?? '',
    settlementStyle: dto.settlementStyle,
    settlementAmount: dto.settlementAmount,
    receivingAccountUuid: dto.receivingAccountUuid ?? '',
    remark: dto.remark ?? '',
    isActive: dto.isActive,
    balance: dto.balance ?? 0,
  };
}

/** 銷售管道暨收款方式：定義每個銷售管道的入帳規則與收款帳戶，供帳簿頁「銷售款項」使用 */
export default function ChannelRuleSection({ accounts }: ChannelRuleSectionProps) {
  const [rules, setRules] = useState<ChannelRuleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ChannelRuleRecord | undefined>(undefined);
  const [actionError, setActionError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [pendingDeactivate, setPendingDeactivate] = useState<ChannelRuleRecord | null>(null);

  const loadRules = () => {
    setLoading(true);
    setLoadError('');
    listChannelRules()
      .then(list => setRules(list.map(toChannelRuleRecord)))
      .catch(err => setLoadError(getFriendlyErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRules();
  }, []);

  const accountLabel = (uuid: string) => accounts.find(a => a.id === uuid)?.nickname || '—';

  const openNew = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };
  const openEdit = (rule: ChannelRuleRecord) => {
    setEditing(rule);
    setDialogOpen(true);
  };
  const handleSubmit = async (data: Omit<ChannelRuleRecord, 'id'>) => {
    if (editing) {
      await updateChannelRule({ uuid: editing.id, ...data });
    } else {
      await createChannelRule(data);
    }
    loadRules();
  };

  const deactivateRule = async (rule: ChannelRuleRecord) => {
    setSavingId(rule.id);
    setActionError('');
    try {
      const { id, ...body } = rule;
      await updateChannelRule({ ...body, uuid: id, isActive: false });
      loadRules();
    } catch (err) {
      setActionError(getFriendlyErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  const activateRule = async (rule: ChannelRuleRecord) => {
    setSavingId(rule.id);
    setActionError('');
    try {
      const { id, ...body } = rule;
      await updateChannelRule({ ...body, uuid: id, isActive: true });
      loadRules();
    } catch (err) {
      setActionError(getFriendlyErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-dark">銷售管道暨收款方式</h2>
          <p className="mt-1 text-xs text-neutral-mid">定義每個銷售管道的入帳規則與收款帳戶，供帳簿頁登錄銷售款項時選擇</p>
        </div>
        <Button size="sm" icon={CirclePlus} onClick={openNew}>
          新增銷售管道
        </Button>
      </div>

      {actionError && <p className="mb-4 text-sm text-semantic-error">{actionError}</p>}

      {loading ? (
        <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">載入中…</div>
      ) : loadError ? (
        <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-semantic-error">{loadError}</div>
      ) : rules.length === 0 ? (
        <div className="rounded-md bg-surface-cream p-6 text-center text-sm text-neutral-mid">目前沒有銷售管道資料</div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-md border border-neutral-blue-gray/30 nav:block">
            <table className="w-full table-fixed border-collapse text-sm">
              <colgroup>
                <col />
                <col className="w-[280px]" />
                <col className="w-[96px]" />
                <col className="w-[168px]" />
              </colgroup>
              <thead className="bg-surface-off-white">
                <tr className="border-b border-neutral-blue-gray/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-mid">管道名稱</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-mid">收款帳戶</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-mid">狀態</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-mid">操作</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule, i) => {
                  const isOtherChannel = rule.channelName === '其他';
                  return (
                    <tr
                      key={rule.id}
                      className={`border-b border-neutral-blue-gray/20 last:border-0 ${i % 2 === 1 ? 'bg-surface-warm/30' : ''}`}
                    >
                      <td className="truncate px-4 py-3.5 font-semibold text-neutral-dark" title={rule.channelName}>
                        {rule.channelName || '—'}
                      </td>
                      <td className="truncate px-4 py-3.5 text-neutral-mid" title={accountLabel(rule.receivingAccountUuid)}>
                        {accountLabel(rule.receivingAccountUuid)}
                      </td>
                      <td className="px-4 py-3.5">
                        {rule.isActive ? (
                          <Badge tone="success" variant="muted">
                            啟用中
                          </Badge>
                        ) : (
                          <Badge tone="neutral" variant="muted">
                            已停用
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="ghost" disabled={isOtherChannel} onClick={() => openEdit(rule)}>
                            編輯
                          </Button>
                          {rule.isActive ? (
                            <Button
                              size="sm"
                              variant="danger"
                              disabled={isOtherChannel || savingId === rule.id}
                              onClick={() => setPendingDeactivate(rule)}
                            >
                              停用
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" disabled={savingId === rule.id} onClick={() => activateRule(rule)}>
                              啟用
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2.5 nav:hidden">
            {rules.map(rule => {
              const isOtherChannel = rule.channelName === '其他';
              return (
                <div key={rule.id} className="flex flex-col gap-1.5 rounded-lg border border-neutral-blue-gray/30 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="truncate font-semibold text-neutral-dark">{rule.channelName}</span>
                      {rule.isActive ? (
                        <Badge tone="success" variant="muted">
                          啟用中
                        </Badge>
                      ) : (
                        <Badge tone="neutral" variant="muted">
                          已停用
                        </Badge>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button size="sm" variant="ghost" disabled={isOtherChannel} onClick={() => openEdit(rule)}>
                        編輯
                      </Button>
                      {rule.isActive ? (
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={isOtherChannel || savingId === rule.id}
                          onClick={() => setPendingDeactivate(rule)}
                        >
                          停用
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled={savingId === rule.id} onClick={() => activateRule(rule)}>
                          啟用
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-neutral-mid">{formatSettlement(rule.settlementStyle, rule.settlementAmount)}</div>
                  <div className="truncate text-xs text-neutral-mid">收款帳戶：{accountLabel(rule.receivingAccountUuid)}</div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <ChannelRuleDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleSubmit} initial={editing} accounts={accounts} />

      <ConfirmDeleteDialog
        open={!!pendingDeactivate}
        onClose={() => setPendingDeactivate(null)}
        onConfirm={() => {
          if (pendingDeactivate) deactivateRule(pendingDeactivate);
        }}
        title="停用銷售管道"
        message={`確定要停用「${pendingDeactivate?.channelName}」嗎？停用後可於清單重新啟用。`}
        confirmLabel="確定停用"
      />
    </div>
  );
}
