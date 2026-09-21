'use client';

import { useInitialization } from '../../state/InitializationContext';
import { SettlementDropzone } from '../SettlementDropzone';
import { SettlementExampleDialog } from '../SettlementExampleDialog';
import { recognizeSettlementReports } from '@/api/initialization';
import { MobileFixedBottom } from '@/components/onboarding/MobileFixedBottom';
import Button from '@/components/ui/Button';
import { getFriendlyErrorMessage } from '@/lib/errors';
import type { OperatingStatus, SettlementReportId } from '../../state/initializationReducer';
import { useState } from 'react';

const REQUIRED_DOCS = ['00 封面', '01 損益及稅額計算表', '03 資產負債表', '08 年度各類給付扣繳股利憑單金額與申報金額調節表', '09 營利事業投資人明細及分配盈餘表', '財產目錄（如有）'];

const TABLE_REPORT_IDS: SettlementReportId[] = ['shareholders', 'propertyList'];

export function Step2Operating() {
  const { state, dispatch } = useInitialization();
  const [exampleOpen, setExampleOpen] = useState(false);
  const [recognizing, setRecognizing] = useState(false);

  const handleFilesSelected = async (files: File[]) => {
    const stubs = files.map(file => ({
      id: crypto.randomUUID(),
      fileName: file.name,
      size: file.size,
      status: 'recognizing' as const,
      errorMessage: null,
    }));
    dispatch({ type: 'ADD_SETTLEMENT_FILES', payload: stubs });
    setRecognizing(true);

    try {
      const result = await recognizeSettlementReports({ userUuid: state.userUuid, files });

      if (result.company) {
        const c = result.company;
        dispatch({
          type: 'SET_COMPANY',
          payload: {
            taxId: c.taxId || state.company.taxId,
            name: c.companyName || state.company.name,
            representative: c.representative || state.company.representative,
            address: c.address || state.company.address,
            openDate: c.openDate || state.company.openDate,
            isOperating: c.openDate ? true : state.company.isOperating,
          },
        });
      }

      (Object.entries(result.reports) as [SettlementReportId, (typeof result.reports)[SettlementReportId]][]).forEach(([reportId, data]) => {
        if (!data) return;
        if (data.fields && Object.keys(data.fields).length > 0) {
          dispatch({ type: 'APPLY_RECOGNIZED_REPORT_FIELDS', payload: { reportId, fields: data.fields } });
        }
        if (TABLE_REPORT_IDS.includes(reportId) && data.rows && data.rows.length > 0) {
          dispatch({ type: 'APPLY_RECOGNIZED_REPORT_ROWS', payload: { reportId, rows: data.rows } });
        }
      });

      stubs.forEach(stub => dispatch({ type: 'SET_SETTLEMENT_FILE_STATUS', payload: { id: stub.id, status: 'done', errorMessage: null } }));
    } catch (err) {
      const message = getFriendlyErrorMessage(err, '辨識失敗，請重試或改用手動輸入');
      stubs.forEach(stub => dispatch({ type: 'SET_SETTLEMENT_FILE_STATUS', payload: { id: stub.id, status: 'error', errorMessage: message } }));
    } finally {
      setRecognizing(false);
    }
  };

  const handleSelectStatus = (status: OperatingStatus) => {
    dispatch({ type: 'SET_OPERATING_STATUS', payload: status });
  };

  return (
    <>
      <SettlementExampleDialog open={exampleOpen} onClose={() => setExampleOpen(false)} />

      <div className='flex flex-col md:flex-row flex-1 min-h-0'>
        {/* 左欄：營運狀況選擇＋上傳 */}
        <div className='flex flex-1 flex-col min-h-0 md:w-1/2 p-5 md:p-12 md:overflow-y-auto'>
          <div className='flex flex-col gap-5'>
            <h1 className='text-xl font-bold text-neutral-dark font-notoSerif'>開帳設定</h1>
            <p className='text-sm font-semibold text-neutral-dark'>請選擇您的營運狀況</p>

            <div className='flex flex-col gap-3'>
              <label className='flex cursor-pointer items-center gap-2'>
                <input
                  type='radio'
                  name='operatingStatus'
                  className='h-4 w-4 accent-brand-blue'
                  checked={state.operatingStatus === 'under_one_year'}
                  onChange={() => handleSelectStatus('under_one_year')}
                />
                <span className='text-sm text-neutral-dark'>尚未結算申報過（公司營運未滿一年）</span>
              </label>
              <label className='flex cursor-pointer items-center gap-2'>
                <input
                  type='radio'
                  name='operatingStatus'
                  className='h-4 w-4 accent-brand-blue'
                  checked={state.operatingStatus === 'over_one_year'}
                  onChange={() => handleSelectStatus('over_one_year')}
                />
                <span className='text-sm text-neutral-dark'>穩定經營超過一年以上</span>
              </label>
            </div>

            {state.operatingStatus === 'over_one_year' && (
              <>
                <SettlementDropzone
                  files={state.settlementFiles}
                  disabled={recognizing}
                  onFilesSelected={handleFilesSelected}
                  onRemove={id => dispatch({ type: 'REMOVE_SETTLEMENT_FILE', payload: { id } })}
                />
                <button type='button' onClick={() => setExampleOpen(true)} className='self-start text-sm text-brand-blue underline underline-offset-2'>
                  查看範例
                </button>
                <div className='rounded-lg border border-neutral-blue-gray/30 bg-surface-off-white p-4 text-sm text-neutral-dark'>
                  <p className='mb-2'>您可以提供多個檔案，或是一份完整的結算申報書。完整的開帳會需要以下：</p>
                  <ul className='list-inside list-disc space-y-1 text-neutral-mid'>
                    {REQUIRED_DOCS.map(doc => (
                      <li key={doc}>{doc}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>

          <MobileFixedBottom>
            <Button onClick={() => dispatch({ type: 'NEXT_STEP' })} disabled={!state.operatingStatus || recognizing} className='w-full'>
              下一步
            </Button>
          </MobileFixedBottom>
        </div>

        {/* 右欄：宣傳圖片（手機版排序在下、固定高度；比照 onboarding Step3AUpload 圖片欄寫法） */}
        <div className='order-2 h-[180px] shrink-0 md:order-2 md:h-auto md:w-1/2 relative overflow-hidden bg-semantic-success-deep'>
          {/* 全站慣例用原生 img，不使用 next/image */}
          <img src='/etlite/promotional2.webp' alt='Easytax 服務宣傳圖' className='absolute inset-0 h-full w-full object-cover object-center' />
        </div>
      </div>
    </>
  );
}
