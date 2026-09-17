'use client';

import { step5ASimpleSchema, step5AAdvancedSchema } from '../../schemas';
import { useOnboarding } from '../../state/OnboardingContext';
import { btnPrimaryDisableable } from '../../styles';
import Field from '../Field';
import { estimateTax } from '@/api/onboarding/taxEstimate';
import {
  getTaxIndustries,
  type Industry,
} from '@/api/onboarding/taxIndustries';
import { MobileFixedBottom } from '@/components/onboarding/MobileFixedBottom';
import Select from '@/components/ui/Select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

function formatTaxAmount(amount: number): string {
  if (amount === 0) return '扣除額範圍內免繳';
  return `$ ${amount.toLocaleString('zh-TW')}`;
}

export function Step5BResult() {
  const { state, dispatch } = useOnboarding();
  const { tax } = state;
  const result = tax.result;

  const [mode, setMode] = useState<'simple' | 'advanced'>(tax.mode);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loadingIndustries, setLoadingIndustries] = useState(true);

  // 簡易模式 state
  const [industryId, setIndustryId] = useState(tax.simple.industryId);
  const [revenue, setRevenue] = useState(
    tax.simple.estimatedRevenue || 1000000
  );
  const [profitRate, setProfitRate] = useState(
    tax.simple.estimatedProfitRate || 10
  );

  // 進階模式 state
  const [adv, setAdv] = useState(tax.advanced);
  const netProfit = adv.revenue - adv.costAndExpense;

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [focusedAdvField, setFocusedAdvField] = useState<string | null>(null);
  const resultSectionRef = useRef<HTMLDivElement>(null);
  const formTopRef = useRef<HTMLDivElement>(null);

  const advFieldDisplay = (key: string) => {
    const val = (adv as Record<string, number>)[key];
    if (focusedAdvField === key || !val) return val ? String(val) : '';
    return val.toLocaleString('zh-TW');
  };

  useEffect(() => {
    getTaxIndustries()
      .then(res => setIndustries(res ?? []))
      .catch(() => toast.error('取得行業列表失敗，請重新整理'))
      .finally(() => setLoadingIndustries(false));
  }, []);

  const handleIndustryChange = (id: string) => {
    setIndustryId(id);
    const industry = industries.find(i => String(i.id) === id);
    if (industry) {
      setRevenue(industry.defaultRevenue);
      setProfitRate(industry.netProfitRate);
      // 進階模式也同步更新擴大書審純益率
      setAdv(prev => ({
        ...prev,
        expandedAuditProfitRate: industry.expandedAuditProfitRate,
      }));
    }
  };

  const handleCalculate = async () => {
    setErrors({});
    setLoading(true);

    try {
      let requestData;

      if (mode === 'simple') {
        const parsed = step5ASimpleSchema.safeParse({
          industryId,
          estimatedRevenue: revenue,
          estimatedProfitRate: profitRate,
        });
        if (!parsed.success) {
          const fe: Record<string, string> = {};
          for (const issue of parsed.error.issues)
            fe[String(issue.path[0])] = issue.message;
          setErrors(fe);
          setLoading(false);
          return;
        }
        requestData = {
          revenue,
          costAndExpense: 0,
          employeeSalary: 0,
          personalRent: 0,
          otherExpense: 0,
          industryIncomeId: Number(industryId),
          isAdvanced: false,
          netProfitRate: profitRate,
          expandedAuditProfitRate: 0,
        };
      } else {
        const fe: Record<string, string> = {};
        if (!industryId) fe.industryId = '請選擇行業類別';
        const parsed = step5AAdvancedSchema.safeParse(adv);
        if (!parsed.success) {
          for (const issue of parsed.error.issues)
            fe[String(issue.path[0])] = issue.message;
        }
        if (Object.keys(fe).length > 0) {
          setErrors(fe);
          setLoading(false);
          return;
        }
        requestData = {
          revenue: adv.revenue,
          costAndExpense: adv.costAndExpense,
          employeeSalary: adv.employeeSalary ?? 0,
          personalRent: adv.personalRent ?? 0,
          otherExpense: adv.otherExpense ?? 0,
          industryIncomeId: Number(industryId),
          isAdvanced: true,
          netProfitRate: profitRate,
          expandedAuditProfitRate: adv.expandedAuditProfitRate,
        };
      }

      dispatch({ type: 'SET_TAX_MODE', payload: mode });
      dispatch(
        mode === 'simple'
          ? {
              type: 'SET_TAX_SIMPLE',
              payload: {
                industryId,
                industryName:
                  industries.find(i => String(i.id) === industryId)
                    ?.industryName ?? '',
                estimatedRevenue: revenue,
                estimatedProfitRate: profitRate,
              },
            }
          : { type: 'SET_TAX_ADVANCED', payload: adv }
      );

      const response = await estimateTax(requestData);
      dispatch({ type: 'SET_TAX_RESULT', payload: response });
      // 手機版：計算完成後滾動至結果區塊
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
          resultSectionRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, 100);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '稅金試算失敗，請重試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex flex-col md:flex-row min-h-full md:flex-1 md:min-h-0'>
      {/* 左欄：表單輸入 */}
      <div
        ref={formTopRef}
        className='order-1 w-full md:w-1/2 bg-white flex flex-col px-6 pt-4 pb-6 md:p-12 md:overflow-y-auto'
      >
        <button
          onClick={() => dispatch({ type: 'PREV_STEP' })}
          className='hidden md:flex items-center gap-1 text-sm text-neutral-dark/60 hover:text-neutral-dark transition-colors mb-2'
        >
          <ChevronLeft size={16} /> 上一頁
        </button>
        <div className='flex flex-col gap-5 mt-2 md:mt-4'>
          {mode === 'simple' ? (
            <div className='flex flex-col gap-5'>
              <p className='text-sm text-neutral-dark/60 leading-relaxed'>
                請選擇您的行業類別，讓 EasyTax
                預估您每期營業稅以及年度營所稅會需要繳那個金額。如有確切的金額，可以切換到進階模式輸入，得到更準確的預估。
              </p>
              {/* 行業類別 */}
              <div className='flex flex-col gap-1'>
                <label className='text-sm font-medium text-neutral-dark'>
                  行業類別 <span className='text-brand-blue'>*</span>
                </label>
                <Select
                  value={industryId}
                  onValueChange={handleIndustryChange}
                  disabled={loadingIndustries}
                >
                  <option value=''>請選擇行業類別</option>
                  {industries.map(i => (
                    <option key={i.id} value={String(i.id)}>
                      {i.industryName}
                    </option>
                  ))}
                </Select>
                {errors.industryId && (
                  <p className='text-xs text-semantic-error'>
                    {errors.industryId}
                  </p>
                )}
              </div>

              {/* 預估營業額 Slider */}
              <div className='flex flex-col gap-2'>
                <div className='flex items-center justify-between'>
                  <label className='text-sm font-medium text-neutral-dark'>
                    預估營業額
                  </label>
                  <span className='text-sm font-semibold text-brand-blue'>
                    $ {(revenue / 10000).toFixed(0)} 萬
                  </span>
                </div>
                <input
                  type='range'
                  min={1000000}
                  max={10000000}
                  step={100000}
                  value={revenue}
                  onChange={e => setRevenue(Number(e.target.value))}
                  className='w-full accent-brand-blue'
                />
                <div className='flex justify-between text-xs text-neutral-dark/40'>
                  <span>100 萬</span>
                  <span>1000 萬</span>
                </div>
                {errors.estimatedRevenue && (
                  <p className='text-xs text-semantic-error'>
                    {errors.estimatedRevenue}
                  </p>
                )}
              </div>

              {/* 預估淨利率 Slider */}
              <div className='flex flex-col gap-2'>
                <div className='flex items-center justify-between'>
                  <label className='text-sm font-medium text-neutral-dark'>
                    預估淨利率
                  </label>
                  <span className='text-sm font-semibold text-brand-blue'>
                    {profitRate.toFixed(1)} %
                  </span>
                </div>
                <input
                  type='range'
                  min={1}
                  max={55}
                  step={0.5}
                  value={profitRate}
                  onChange={e => setProfitRate(Number(e.target.value))}
                  className='w-full accent-brand-blue'
                />
                <div className='flex justify-between text-xs text-neutral-dark/40'>
                  <span>1%</span>
                  <span>55%</span>
                </div>
              </div>
            </div>
          ) : (
            /* 進階模式 */
            <div className='flex flex-col gap-4'>
              {/* 行業類別（取代擴大書審純益率滑桿） */}
              <div className='flex flex-col gap-1'>
                <label className='text-sm font-medium text-neutral-dark'>
                  行業類別 <span className='text-brand-blue'>*</span>
                </label>
                <Select
                  value={industryId}
                  onValueChange={handleIndustryChange}
                  disabled={loadingIndustries}
                >
                  <option value=''>請選擇行業類別</option>
                  {industries.map(i => (
                    <option key={i.id} value={String(i.id)}>
                      {i.industryName}
                    </option>
                  ))}
                </Select>
                {/* 選擇後顯示對應的擴大書審純益率 */}
                {industryId && (
                  <p className='text-xs text-neutral-dark/40'>
                    擴大書審純益率：{adv.expandedAuditProfitRate} %
                  </p>
                )}
                {errors.industryId && (
                  <p className='text-xs text-semantic-error'>
                    {errors.industryId}
                  </p>
                )}
              </div>

              {[
                { key: 'revenue', label: '收入 (401)', required: true },
                {
                  key: 'costAndExpense',
                  label: '成本及費用 (401)',
                  required: true,
                },
                { key: 'employeeSalary', label: '員工薪資', required: false },
                { key: 'personalRent', label: '個人房東租金', required: false },
                { key: 'otherExpense', label: '其他費用', required: false },
              ].map(f => (
                <Field
                  key={f.key}
                  label={f.label}
                  required={f.required}
                  type='text'
                  inputMode='numeric'
                  value={advFieldDisplay(f.key)}
                  onFocus={() => setFocusedAdvField(f.key)}
                  onBlur={() => setFocusedAdvField(null)}
                  onChange={e => {
                    const raw = Number(e.target.value.replace(/,/g, ''));
                    setAdv({ ...adv, [f.key]: isNaN(raw) ? 0 : raw });
                  }}
                  error={!!errors[f.key]}
                  errorMessage={errors[f.key]}
                />
              ))}
              <Field
                label='淨利（自動計算）'
                value={netProfit.toLocaleString('zh-TW')}
                disabled
                prefix='$'
                aiFilled
              />

              {/* 預估淨利率（同簡易模式，選擇行業後自動帶入） */}
              <div className='flex flex-col gap-2'>
                <div className='flex items-center justify-between'>
                  <label className='text-sm font-medium text-neutral-dark'>
                    預估淨利率
                  </label>
                  <span className='text-sm font-semibold text-brand-blue'>
                    {profitRate.toFixed(1)} %
                  </span>
                </div>
                <input
                  type='range'
                  min={1}
                  max={55}
                  step={0.5}
                  value={profitRate}
                  onChange={e => setProfitRate(Number(e.target.value))}
                  className='w-full accent-brand-blue'
                />
                <div className='flex justify-between text-xs text-neutral-dark/40'>
                  <span>1%</span>
                  <span>55%</span>
                </div>
              </div>
            </div>
          )}

          <div className='flex items-center justify-end gap-3'>
            <button
              type='button'
              className='shrink-0 flex items-center gap-1 text-sm font-medium text-brand-blue hover:text-brand-blue-dark'
              onClick={() => {
                if (mode === 'simple') {
                  const industry = industries.find(
                    i => String(i.id) === industryId
                  );
                  setAdv(prev => ({
                    ...prev,
                    revenue,
                    costAndExpense: Math.round(
                      revenue * (1 - profitRate / 100)
                    ),
                    employeeSalary: 0,
                    personalRent: 0,
                    otherExpense: 0,
                    ...(industry && {
                      expandedAuditProfitRate: industry.expandedAuditProfitRate,
                    }),
                  }));
                  setMode('advanced');
                } else {
                  setMode('simple');
                }
                // 手機版切換模式後捲回頂部
                if (window.innerWidth < 768) {
                  formTopRef.current?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              {mode === 'simple' ? '切換進階模式' : '切換簡易模式'}
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* 手機版：inline 結果（計算後出現，桌面版 hidden） */}
        {result && (
          <div
            ref={resultSectionRef}
            className='md:hidden mt-4 pt-4 border-t border-surface-cream flex flex-col gap-4'
          >
            {/* 重新計算按鈕置於輸入區塊正下方，方便修改後立即重算 */}
            <button
              onClick={handleCalculate}
              disabled={loading}
              className='w-full rounded border border-brand-blue text-brand-blue py-3 font-medium text-sm hover:bg-brand-blue/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
            >
              {loading ? '計算中...' : '重新計算應納稅金'}
            </button>
            <h2 className='text-base font-semibold text-neutral-dark font-notoSerif'>
              預估應納稅金試算結果
            </h2>
            <div className='flex flex-col gap-4'>
              <div className='rounded-lg bg-surface-off-white border border-surface-cream p-4 flex flex-col gap-2'>
                <p className='text-xs text-neutral-dark/50'>每期營業稅預估</p>
                <span className='text-lg font-bold text-neutral-dark'>
                  {formatTaxAmount(result.biPhaselyBusinessTax.amount)}
                </span>
                <p className='text-xs text-neutral-dark/40'>單月 15 號</p>
              </div>
              <div className='rounded-lg bg-surface-off-white border border-surface-cream p-4 flex flex-col gap-3'>
                <p className='text-xs text-neutral-dark/50'>每年營所稅預估</p>
                <div className='flex flex-col gap-1'>
                  <p className='text-sm text-neutral-dark/60'>採查帳申報</p>
                  <span className='text-base font-bold text-neutral-dark'>
                    {formatTaxAmount(
                      result.annualIncomeTax.documentReview.amount
                    )}
                  </span>
                </div>
                <div className='flex flex-col gap-1'>
                  <p className='text-sm text-neutral-dark/60'>採書審申報</p>
                  <span className='text-base font-bold text-neutral-dark'>
                    {formatTaxAmount(result.annualIncomeTax.bookReview.amount)}
                  </span>
                  <p className='text-xs text-semantic-error leading-relaxed mt-1'>
                    書審申報時需要確保實際淨利率符合【國稅局擴大書審純益率】，否則將無法申報。申報後如遇國稅局查帳，可能會採用【同業淨利率】標準計算而產生補稅。
                  </p>
                </div>
              </div>
            </div>
            <div className='flex flex-col gap-2'>
              <p className='text-xs font-semibold text-neutral-dark/70'>
                注意：
              </p>
              {[
                '營業稅屬於代扣稅金，應將稅金成本估算在您的商品/服務定價中，以免發生入不敷出的現象。',
                '目前試算結果係基於財政部公開資料（113年度營利事業各業所得額暨同業利潤）所產生之抽象化模型所製成，所採用之擴大書審率與淨利率為該產業大類之平均權重，僅供初步經營示意。',
                '精準應納稅額須由 EasyTax 解析您的實際進銷項憑證、扣減項目及精確行業細分編號後產出。',
                'EasyTax 透過系統提供營業人一條便利的報稅管道，並不代表營業人執行稅務申報。營業人有責任確保申報內容之正確性。',
              ].map((note, i) => (
                <p
                  key={i}
                  className='text-xs text-neutral-dark/50 leading-relaxed'
                >
                  {i + 1}. {note}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* 手機版：固定底部按鈕（計算前 → 計算；計算後 → 下一步） */}
        <MobileFixedBottom className='md:hidden'>
          {!result ? (
            <button
              onClick={handleCalculate}
              disabled={loading}
              className='w-full rounded border border-brand-blue text-brand-blue py-3 font-medium text-sm hover:bg-brand-blue/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
            >
              {loading ? '計算中...' : '計算應納稅金'}
            </button>
          ) : (
            <button
              onClick={() => dispatch({ type: 'NEXT_STEP' })}
              disabled={!tax.result}
              className={`${btnPrimaryDisableable} w-full`}
            >
              下一步
            </button>
          )}
        </MobileFixedBottom>

        {/* 桌面版：計算按鈕 */}
        <div className='hidden md:block mt-auto pt-6'>
          <button
            onClick={handleCalculate}
            disabled={loading}
            className='w-full rounded border border-brand-blue text-brand-blue py-3 font-medium text-sm hover:bg-brand-blue/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
          >
            {loading
              ? '計算中...'
              : result
                ? '重新計算應納稅金'
                : '計算應納稅金'}
          </button>
        </div>
      </div>

      {/* 桌面版右欄：計算結果（手機版永遠 hidden） */}
      <div className='hidden md:flex order-2 w-full md:w-1/2 bg-surface-off-white flex-col gap-5 px-8 pt-8 pb-4 md:p-12 md:overflow-y-auto border-l border-surface-cream'>
        <h2 className='text-lg font-semibold text-neutral-dark font-notoSerif'>
          預估應納稅金試算結果
        </h2>

        {result ? (
          <div className='flex flex-col gap-4'>
            <div className='rounded-lg bg-white border border-surface-cream p-4 flex flex-col gap-2'>
              <p className='text-xs text-neutral-dark/50'>每期營業稅預估</p>
              <span className='text-lg font-bold text-neutral-dark'>
                {formatTaxAmount(result.biPhaselyBusinessTax.amount)}
              </span>
              <p className='text-xs text-neutral-dark/40'>單月 15 號</p>
            </div>
            <div className='rounded-lg bg-white border border-surface-cream p-4 flex flex-col gap-3'>
              <p className='text-xs text-neutral-dark/50'>每年營所稅預估</p>
              <div className='flex flex-col gap-1'>
                <p className='text-sm text-neutral-dark/60'>採查帳申報</p>
                <span className='text-base font-bold text-neutral-dark'>
                  {formatTaxAmount(
                    result.annualIncomeTax.documentReview.amount
                  )}
                </span>
              </div>
              <div className='flex flex-col gap-1'>
                <p className='text-sm text-neutral-dark/60'>採書審申報</p>
                <span className='text-base font-bold text-neutral-dark'>
                  {formatTaxAmount(result.annualIncomeTax.bookReview.amount)}
                </span>
                <p className='text-xs text-semantic-error leading-relaxed mt-1'>
                  書審申報時需要確保實際淨利率符合【國稅局擴大書審純益率】，否則將無法申報。申報後如遇國稅局查帳，可能會採用【同業淨利率】標準計算而產生補稅。
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className='text-sm text-neutral-dark/40'>
            請在左側輸入資料後按下「計算應納稅金」
          </p>
        )}

        <div className='flex flex-col gap-2 mt-2'>
          <p className='text-xs font-semibold text-neutral-dark/70'>注意：</p>
          {[
            '營業稅屬於代扣稅金，應將稅金成本估算在您的商品/服務定價中，以免發生入不敷出的現象。',
            '目前試算結果係基於財政部公開資料（113年度營利事業各業所得額暨同業利潤）所產生之抽象化模型所製成，所採用之擴大書審率與淨利率為該產業大類之平均權重，僅供初步經營示意。',
            '精準應納稅額須由 EasyTax 解析您的實際進銷項憑證、扣減項目及精確行業細分編號後產出。',
            'EasyTax 透過系統提供營業人一條便利的報稅管道，並不代表營業人執行稅務申報。營業人有責任確保申報內容之正確性。',
          ].map((note, i) => (
            <p key={i} className='text-xs text-neutral-dark/50 leading-relaxed'>
              {i + 1}. {note}
            </p>
          ))}
        </div>

        {/* 桌面版下一步 */}
        <div className='mt-auto pt-6'>
          <button
            onClick={() => dispatch({ type: 'NEXT_STEP' })}
            disabled={!tax.result}
            className={`${btnPrimaryDisableable} w-full`}
          >
            下一步
          </button>
        </div>
      </div>
    </div>
  );
}
