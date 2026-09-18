'use client';

import { useInitialization } from '../../state/InitializationContext';
import { btnTextLink } from '../../styles';
import { groupRecognizedFields } from '../../utils/openingBalance';
import { DocumentCard } from '../DocumentCard';
import { recognizeInitializationDocument } from '@/api/initialization';
import { MobileFixedBottom } from '@/components/onboarding/MobileFixedBottom';
import Button from '@/components/ui/Button';
import { getFriendlyErrorMessage } from '@/lib/errors';
import type { DocumentCategory } from '../../state/initializationReducer';

interface DocumentConfig {
  category: DocumentCategory;
  label: string;
  hint: string;
  accept: string;
  primary?: boolean;
}

const DOCUMENTS: DocumentConfig[] = [
  {
    category: 'incomeTaxReport',
    label: '營所稅結算申報書',
    hint: '含完整資產負債表，是期初資料最完整的來源（PDF / JPG / PNG）',
    accept: '.pdf,.jpg,.jpeg,.png',
    primary: true,
  },
  {
    category: 'businessTax401',
    label: '401 營業稅申報書',
    hint: '補上營業稅留抵稅額與營業額（PDF / JPG / PNG）',
    accept: '.pdf,.jpg,.jpeg,.png',
  },
  {
    category: 'invoiceExcel',
    label: '財政部進銷項 Excel',
    hint: '財政部電子發票平台下載的進銷項清單（.xlsx）',
    accept: '.xlsx',
  },
  {
    category: 'bankStatement',
    label: '銀行對帳單',
    hint: '核對銀行存款期初餘額（.xlsx / .csv）',
    accept: '.xlsx,.csv',
  },
];

export function Step3AUpload() {
  const { state, dispatch } = useInitialization();

  const handleFileSelect = async (category: DocumentCategory, file: File) => {
    dispatch({ type: 'SET_DOCUMENT_STATUS', payload: { category, status: 'recognizing', fileName: file.name, errorMessage: null } });
    try {
      const result = await recognizeInitializationDocument({ userUuid: state.userUuid, category, file });
      const grouped = groupRecognizedFields(result.fields);
      (Object.keys(grouped) as (keyof typeof grouped)[]).forEach(group => {
        const fields = grouped[group];
        if (fields) dispatch({ type: 'APPLY_RECOGNIZED_BALANCE', payload: { group, fields } });
      });
      dispatch({ type: 'SET_DOCUMENT_STATUS', payload: { category, status: 'done', fileName: file.name, errorMessage: null } });
    } catch (err) {
      dispatch({
        type: 'SET_DOCUMENT_STATUS',
        payload: { category, status: 'error', fileName: file.name, errorMessage: getFriendlyErrorMessage(err, '辨識失敗，請重試或改用手動輸入') },
      });
    }
  };

  const handleRemove = (category: DocumentCategory) => {
    dispatch({ type: 'SET_DOCUMENT_STATUS', payload: { category, status: 'empty', fileName: null, errorMessage: null } });
  };

  const hasAnyDone = Object.values(state.documents).some(d => d.status === 'done');
  const isBusy = Object.values(state.documents).some(d => d.status === 'recognizing' || d.status === 'uploading');

  return (
    <div className='flex flex-col flex-1 min-h-0 p-5 md:p-12 md:overflow-y-auto'>
      <div className='flex flex-col gap-5'>
        <div>
          <h1 className='text-xl md:text-2xl font-bold text-neutral-dark mb-2 font-notoSerif'>上傳期初資料文件</h1>
          <p className='text-sm text-neutral-mid'>
            上傳您手邊的申報書或報表，系統會自動辨識並帶入期初餘額，您仍可在下一步逐項核對修改。文件皆為選填，沒有的可以先跳過。
          </p>
        </div>

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
          {DOCUMENTS.map(doc => (
            <DocumentCard
              key={doc.category}
              label={doc.label}
              hint={doc.hint}
              accept={doc.accept}
              primary={doc.primary}
              slot={state.documents[doc.category]}
              onFileSelect={file => handleFileSelect(doc.category, file)}
              onRemove={() => handleRemove(doc.category)}
            />
          ))}
        </div>
      </div>

      <MobileFixedBottom className='flex flex-col gap-3'>
        <Button onClick={() => dispatch({ type: hasAnyDone ? 'NEXT_STEP' : 'START_MANUAL_BALANCE' })} disabled={isBusy} className='w-full'>
          {hasAnyDone ? '下一步：核對期初資料' : '手動輸入期初資料'}
        </Button>
        <button type='button' onClick={() => dispatch({ type: 'SKIP_OPENING_BALANCE' })} className={btnTextLink}>
          稍後再設定，先進系統
        </button>
      </MobileFixedBottom>
    </div>
  );
}
