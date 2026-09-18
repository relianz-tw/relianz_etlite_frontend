import type { BalanceGroup, InitializationState } from '../state/initializationReducer';
import MoneyInput from '@/components/ui/MoneyInput';

interface FieldMeta {
  key: string;
  label: string;
  /** 允許輸入負數（如累積盈虧、業主往來可能反向） */
  allowSign?: boolean;
}

const GROUP_FIELDS: Record<BalanceGroup, FieldMeta[]> = {
  assets: [
    { key: 'cash', label: '現金' },
    { key: 'bankDeposits', label: '銀行存款' },
    { key: 'accountsReceivable', label: '應收帳款' },
    { key: 'inventory', label: '存貨' },
    { key: 'businessTaxCredit', label: '營業稅留抵稅額' },
    { key: 'fixedAssets', label: '固定資產' },
  ],
  liabilities: [
    { key: 'accountsPayable', label: '應付帳款' },
    { key: 'shortTermLoans', label: '短期借款' },
    { key: 'ownerCurrentAccount', label: '業主往來', allowSign: true },
  ],
  equity: [
    { key: 'registeredCapital', label: '登記資本額' },
    { key: 'retainedEarnings', label: '累積盈虧', allowSign: true },
  ],
};

const GROUP_LABEL: Record<BalanceGroup, string> = {
  assets: '資產',
  liabilities: '負債',
  equity: '權益',
};

interface OpeningBalanceFormProps {
  balance: InitializationState['openingBalance'];
  onChangeField: (group: BalanceGroup, key: string, value: number) => void;
}

/** 期初表分組表單，3B 校正頁與手動輸入路徑共用（差別僅在呼叫端是否有文件預覽） */
export function OpeningBalanceForm({ balance, onChangeField }: OpeningBalanceFormProps) {
  return (
    <div className="flex flex-col gap-6">
      {(Object.keys(GROUP_FIELDS) as BalanceGroup[]).map(group => (
        <div key={group} className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-neutral-dark">{GROUP_LABEL[group]}</h3>
          <div className="flex flex-col gap-3">
            {GROUP_FIELDS[group].map(field => {
              const data = (balance[group] as unknown as Record<string, { value: number; aiFilled: boolean }>)[field.key];
              return (
                <div key={field.key} className="flex items-center justify-between gap-4">
                  <span className="shrink-0 text-sm font-semibold text-neutral-dark">{field.label}</span>
                  <div className="flex items-center gap-2">
                    {data.aiFilled && <span className="text-xs text-semantic-success">來自文件</span>}
                    <MoneyInput
                      widthClassName="w-40"
                      value={data.value}
                      allowSign={field.allowSign}
                      aiFilled={data.aiFilled}
                      onChange={value => onChangeField(group, field.key, value)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
