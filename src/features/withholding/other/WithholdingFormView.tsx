'use client';

import { useSearchParams } from 'next/navigation';
import GeneralForm from './components/GeneralForm';
import RentalForm from './components/RentalForm';
import { getWithholdingRecord } from './mockStore';

interface WithholdingFormViewProps {
  /** 提供時為編輯模式，內部依此 uuid 從 mockStore 讀取扣繳資料（不由外層 Server Component 傳入完整物件，
   *  因假資料僅存於瀏覽器端記憶體，伺服器端永遠只會讀到初始種子資料） */
  recordId?: string;
}

/** 依類別代碼派發到租金專屬表單或其餘 8 類共用的通用表單；新增模式由網址 ?ic= 決定類別，編輯模式由紀錄本身決定 */
export default function WithholdingFormView({ recordId }: WithholdingFormViewProps) {
  const searchParams = useSearchParams();
  const record = recordId ? getWithholdingRecord(recordId) : undefined;
  const categoryCode = record?.categoryCode ?? searchParams.get('ic');

  if (categoryCode === '51') {
    return <RentalForm recordId={recordId} />;
  }
  return <GeneralForm recordId={recordId} />;
}
