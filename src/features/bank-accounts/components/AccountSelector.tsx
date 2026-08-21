'use client';

import type { BankAccountDto } from '@/api/types';
import Select from '@/components/ui/Select';

interface AccountSelectorProps {
  accounts: BankAccountDto[];
  value: string;
  onChange: (bankAccountUuid: string) => void;
}

export default function AccountSelector({ accounts, value, onChange }: AccountSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      {accounts.map(account => (
        <option key={account.bankAccountUuid} value={account.bankAccountUuid}>
          {account.accountName || account.bankName}・{account.branchName}（{account.accountNo}）
        </option>
      ))}
    </Select>
  );
}
