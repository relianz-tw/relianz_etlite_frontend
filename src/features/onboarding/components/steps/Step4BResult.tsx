'use client';

import { step4ASchema } from '../../schemas';
import { useOnboarding } from '../../state/OnboardingContext';
import { btnPrimaryDisableable } from '../../styles';
import { SalaryDocumentPreview } from '../SalaryDocumentPreview';
import Field from '../Field';
import { previewNhiSafe } from '@/api/onboarding/preview';
import { calculateSalary } from '@/api/onboarding/salaryCalculate';
import { fetchInsuranceGrades } from '@/api/insurance';
import { MobileFixedBottom } from '@/components/onboarding/MobileFixedBottom';
import Checkbox from '@/components/ui/Checkbox';
import Select from '@/components/ui/Select';
import DatePicker from '@/components/ui/DatePicker';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type NhiGrade = {
  id: number;
  grade: number;
  isParttime: boolean;
  salaryMin: number;
  salaryMax: number | null;
  effectiveStart: string;
  effectiveEnd: string;
};

type LaborGrade = {
  id: number;
  grade: number;
  isParttime: boolean;
  salaryMin: number;
  salaryMax: number | null;
  effectiveStart: string;
  effectiveEnd: string;
};

type LaborPensionGrade = {
  id: number;
  grade: number;
  isParttime: boolean;
  salaryMin: number;
  salaryMax: number | null;
  effectiveStart: string;
  effectiveEnd: string;
};

function formatGradeLabel(salaryMin: number, salaryMax: number | null): string {
  if (salaryMin === 0 && (salaryMax === 0 || salaryMax == null))
    return '無投保';
  if (salaryMax == null) return `$${salaryMin.toLocaleString('zh-TW')} 以上`;
  return `$${salaryMin.toLocaleString('zh-TW')} ~ $${salaryMax.toLocaleString(
    'zh-TW'
  )}`;
}

function matchGradeId(
  grades: Array<{ id: number; salaryMin: number; salaryMax: number | null }>,
  salary: number,
  fallbackToMax = false
): string {
  if (!salary) return '';
  const valid = grades.filter(g => !(g.salaryMin === 0 && g.salaryMax === 0));
  const match = valid.find(
    g => salary >= g.salaryMin && (g.salaryMax == null || salary <= g.salaryMax)
  );
  if (match) return String(match.id);
  if (fallbackToMax && valid.length > 0)
    return String(valid[valid.length - 1].id);
  return '';
}

function parseDateStr(str: string): Date | undefined {
  if (!str) return undefined;
  const [y, m, d] = str.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

function formatAmount(n: number | null | undefined): string {
  if (n == null) return '';
  return n.toLocaleString('zh-TW');
}

type FieldErrors = {
  fixedSalary?: string;
  payDate?: string;
};

export function Step4BResult() {
  const { state, dispatch } = useOnboarding();
  const { salary, company, contact, taxId } = state;

  const [fixedSalary, setFixedSalary] = useState(
    salary.fixedSalary ? String(salary.fixedSalary) : ''
  );
  const [variableSalary, setVariableSalary] = useState(
    salary.variableSalary ? String(salary.variableSalary) : ''
  );
  const [payDate, setPayDate] = useState(salary.payDate);
  const [isExpanded, setIsExpanded] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [focusedAmountField, setFocusedAmountField] = useState<string | null>(
    null
  );

  const amountDisplay = (raw: string, field: string) =>
    focusedAmountField === field || !raw
      ? raw
      : Number(raw).toLocaleString('zh-TW');

  const [nhiGrades, setNhiGrades] = useState<NhiGrade[]>([]);
  const [laborGrades, setLaborGrades] = useState<LaborGrade[]>([]);
  const [pensionGrades, setPensionGrades] = useState<LaborPensionGrade[]>([]);
  const [gradesLoaded, setGradesLoaded] = useState(false);
  const [gradesLoading, setGradesLoading] = useState(false);

  const nhiGradeId = salary.nhiGradeId != null ? String(salary.nhiGradeId) : '';
  const setNhiGradeId = (val: string) =>
    dispatch({
      type: 'SET_SALARY_INPUT',
      payload: { nhiGradeId: val ? Number(val) : null },
    });
  const laborGradeId =
    salary.laborGradeId != null ? String(salary.laborGradeId) : '';
  const setLaborGradeId = (val: string) =>
    dispatch({
      type: 'SET_SALARY_INPUT',
      payload: { laborGradeId: val ? Number(val) : null },
    });
  const [nhiDependents, setNhiDependents] = useState('0');
  const [pensionGradeId, setPensionGradeId] = useState('');
  const [hasVoluntaryPension, setHasVoluntaryPension] = useState(false);
  const [voluntaryPensionRate, setVoluntaryPensionRate] = useState('');
  const [nhiGradeManuallySet, setNhiGradeManuallySet] = useState(false);
  const [laborGradeManuallySet, setLaborGradeManuallySet] = useState(false);

  const result = salary.result;
  const autoCalcRef = useRef(false);
  const resultSectionRef = useRef<HTMLDivElement>(null);

  // 進入頁面時若有輸入但無結果（例如從 Step5 回上一步），自動計算一次
  useEffect(() => {
    if (
      !result &&
      !autoCalcRef.current &&
      salary.fixedSalary &&
      salary.payDate
    ) {
      autoCalcRef.current = true;
      triggerCalculate(
        String(salary.fixedSalary),
        String(salary.variableSalary ?? 0),
        salary.payDate,
        nhiGradeId,
        laborGradeId
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleExpanded = async () => {
    const next = !isExpanded;
    setIsExpanded(next);
    if (next && !gradesLoaded && !gradesLoading) {
      setGradesLoading(true);
      try {
        const payload = await fetchInsuranceGrades(new Date().getFullYear());
        const sal = fixedSalary ? Number(fixedSalary) : 0;

        if (payload?.nhiGrades) {
          setNhiGrades(payload.nhiGrades);
          if (sal && !nhiGradeId) {
            const matched = matchGradeId(payload.nhiGrades, sal, true);
            if (matched) setNhiGradeId(matched);
          }
        }
        if (payload?.laborGrades) {
          setLaborGrades(payload.laborGrades);
          if (sal && !laborGradeId) {
            const nonParttime = payload.laborGrades.filter(
              (g: LaborGrade) => !g.isParttime
            );
            const matched = matchGradeId(nonParttime, sal, true);
            if (matched) setLaborGradeId(matched);
          }
        }
        if (payload?.laborPensionGrades)
          setPensionGrades(payload.laborPensionGrades);
        setGradesLoaded(true);
      } catch {
        // 靜默失敗，不影響主要薪資計算
      } finally {
        setGradesLoading(false);
      }
    }
  };

  async function triggerCalculate(
    fxSalary: string,
    varSalary: string,
    pDate: string,
    nhiId: string,
    laborId: string
  ) {
    setLoading(true);
    let resolvedNhiLevelId = nhiId ? Number(nhiId) : 0;
    let resolvedLaborLevelId = laborId ? Number(laborId) : 0;

    if (!isExpanded) {
      try {
        const sal = Number(fxSalary);
        let nhi = nhiGrades;
        let labor = laborGrades;
        if (!gradesLoaded) {
          const payload = await fetchInsuranceGrades(new Date().getFullYear());
          nhi = payload?.nhiGrades ?? [];
          labor = payload?.laborGrades ?? [];
          setNhiGrades(nhi);
          setLaborGrades(labor);
          if (payload?.laborPensionGrades)
            setPensionGrades(payload.laborPensionGrades);
          setGradesLoaded(true);
        }
        const matchedNhi = matchGradeId(nhi, sal, true);
        if (matchedNhi) resolvedNhiLevelId = Number(matchedNhi);
        const matchedLabor = matchGradeId(
          labor.filter((g: LaborGrade) => !g.isParttime),
          sal,
          true
        );
        if (matchedLabor) resolvedLaborLevelId = Number(matchedLabor);
      } catch {
        // 靜默失敗，繼續以 0 計算
      }
    }

    const pDateParts = pDate.split('-');
    const reqData = {
      fixedSalary: Number(fxSalary),
      variableSalary: varSalary ? Number(varSalary) : 0,
      payDate: pDate.replace(/-/g, ''),
      nhiLevelId: resolvedNhiLevelId,
      nhiDependents: Number(nhiDependents),
      laborLevelId: resolvedLaborLevelId,
      voluntaryPensionId:
        hasVoluntaryPension && pensionGradeId ? Number(pensionGradeId) : 0,
      voluntaryPensionRate:
        hasVoluntaryPension && voluntaryPensionRate
          ? Number(voluntaryPensionRate)
          : 0,
    };

    try {
      const [salaryRes, nhiRes] = await Promise.all([
        calculateSalary(reqData),
        previewNhiSafe({
          fixedSalary: reqData.fixedSalary,
          variableSalary: reqData.variableSalary,
          incomeCode: '50',
          isNhi: true,
          month: Number(pDateParts[1]),
          year: Number(pDateParts[0]),
          nhiGradeId: resolvedNhiLevelId || 1,
        }),
      ]);

      dispatch({
        type: 'SET_SALARY_INPUT',
        payload: {
          fixedSalary: reqData.fixedSalary,
          variableSalary: reqData.variableSalary,
          payDate: pDate,
        },
      });
      dispatch({
        type: 'SET_SALARY_RESULT',
        payload: { ...salaryRes, nhiSupplementary: nhiRes },
      });
      // 手機版：計算完成後滾動至結果區塊
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
          resultSectionRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          });
        }
      }, 100);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '薪資計算失敗，請重試');
    } finally {
      setLoading(false);
    }
  }

  const handleCalculate = async () => {
    setErrors({});
    const validation = step4ASchema.safeParse({
      fixedSalary: fixedSalary ? Number(fixedSalary) : undefined,
      variableSalary: variableSalary ? Number(variableSalary) : undefined,
      payDate,
    });

    if (!validation.success) {
      const fe: FieldErrors = {};
      for (const issue of validation.error.issues) {
        const field = issue.path[0] as keyof FieldErrors;
        if (!fe[field]) fe[field] = issue.message;
      }
      setErrors(fe);
      return;
    }

    await triggerCalculate(
      fixedSalary,
      variableSalary,
      payDate,
      nhiGradeId,
      laborGradeId
    );
  };

  const calcBtnDisabled =
    loading ||
    (hasVoluntaryPension && (!pensionGradeId || !voluntaryPensionRate));

  const calcBtnClass =
    'w-full rounded border border-brand-blue text-brand-blue py-3 font-medium text-sm hover:bg-brand-blue/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

  const NOTES = [
    '員工薪資所得扣繳稅款，應於發薪日後次月 10 日前至銀行或四大超商完成繳納。',
    '二代健保扣款，應於發薪日後次月月底前至銀行或四大超商完成繳納。',
    '二代健保正確計算可能需包含全年度固定及非固定薪資，請確保全年度的薪資都有按月如實填入。',
  ];

  return (
    <div className='flex flex-col md:flex-row min-h-full md:flex-1 md:min-h-0'>
      {/* 桌面版右欄：計算結果（手機版永遠 hidden，改為 inline 顯示） */}
      <div className='hidden md:flex order-2 md:order-2 w-full md:w-1/2 bg-surface-off-white flex-col gap-5 px-8 pt-8 pb-4 md:p-12 md:overflow-y-auto border-l border-surface-cream'>
        <h2 className='text-lg font-semibold text-neutral-dark'>
          薪資計算結果
        </h2>

        {result ? (
          <div className='flex flex-col gap-1'>
            {[
              { label: '薪資扣繳', amount: result.withholding },
              { label: '勞保費', amount: result.laborInsurance.employeeAmount },
              {
                label: '健保費',
                amount: result.healthInsurance.employeeAmount,
              },
              { label: '勞退自提', amount: result.volPension },
            ].map(item => (
              <div
                key={item.label}
                className='flex justify-between items-center py-2 border-b border-surface-cream'
              >
                <span className='text-sm text-neutral-dark'>{item.label}</span>
                <span className='font-semibold text-neutral-dark'>
                  $ {formatAmount(item.amount)}
                </span>
              </div>
            ))}
            <div className='flex justify-between items-start py-2 border-b border-surface-cream'>
              <span className='text-sm text-neutral-dark'>二代健保</span>
              <div className='text-right'>
                <span className='font-semibold text-neutral-dark block'>
                  $ {formatAmount(result.nhiSupplementary?.fee ?? 0)}
                </span>
                {result.nhiSupplementary?.required === false && (
                  <span className='text-xs text-neutral-dark/40'>無需繳納</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className='text-sm text-neutral-dark/40'>
            請在左側輸入薪資後按下「計算薪資」
          </p>
        )}

        <div className='flex flex-col gap-2'>
          <SalaryDocumentPreview
            salary={salary}
            company={company}
            contact={contact}
            taxId={taxId}
            variant='white'
          />
        </div>

        <div className='flex flex-col gap-2 mt-2'>
          <p className='text-xs font-semibold text-neutral-dark/70'>注意：</p>
          {NOTES.map((note, i) => (
            <p
              key={i}
              className='text-xs text-neutral-dark/50 leading-relaxed pl-3 -indent-3'
            >
              • {note}
            </p>
          ))}
        </div>

        {/* 桌面版下一步 */}
        <div className='mt-auto pt-6'>
          <button
            onClick={() => dispatch({ type: 'NEXT_STEP' })}
            disabled={!salary.result}
            className={`${btnPrimaryDisableable} w-full`}
          >
            下一步
          </button>
        </div>
      </div>

      {/* 左欄：表單（手機版全寬單欄，桌面版左半） */}
      <div className='order-1 md:order-1 md:flex-none md:w-1/2 bg-white flex flex-col px-6 pt-4 pb-6 md:p-12 md:overflow-y-auto'>
        <button
          onClick={() => dispatch({ type: 'PREV_STEP' })}
          className='hidden md:flex items-center gap-1 text-sm text-neutral-dark/60 hover:text-neutral-dark transition-colors mb-2'
        >
          <ChevronLeft size={16} /> 上一頁
        </button>
        <div className='flex flex-col gap-4 mt-2 md:mt-4'>
          {/* 固定薪資 */}
          <Field
            label='固定薪資'
            type='text'
            inputMode='numeric'
            prefix='$'
            value={amountDisplay(fixedSalary, 'fixedSalary')}
            onFocus={() => setFocusedAmountField('fixedSalary')}
            onBlur={() => setFocusedAmountField(null)}
            onChange={e => {
              const raw = e.target.value.replace(/,/g, '');
              setFixedSalary(raw);
              setErrors(prev => ({ ...prev, fixedSalary: undefined }));
              if (gradesLoaded) {
                const sal = Number(raw);
                if (!nhiGradeManuallySet && nhiGrades.length > 0) {
                  const matched = matchGradeId(nhiGrades, sal, true);
                  if (matched) setNhiGradeId(matched);
                }
                if (!laborGradeManuallySet && laborGrades.length > 0) {
                  const matched = matchGradeId(
                    laborGrades.filter(g => !g.isParttime),
                    sal,
                    true
                  );
                  if (matched) setLaborGradeId(matched);
                }
              }
            }}
            placeholder='50000'
            error={!!errors.fixedSalary}
            errorMessage={errors.fixedSalary}
          />

          {/* 非固定薪資 */}
          <Field
            label='非固定薪資（獎金）'
            type='text'
            inputMode='numeric'
            prefix='$'
            value={amountDisplay(variableSalary, 'variableSalary')}
            onFocus={() => setFocusedAmountField('variableSalary')}
            onBlur={() => setFocusedAmountField(null)}
            onChange={e => setVariableSalary(e.target.value.replace(/,/g, ''))}
            placeholder='0'
          />

          {/* 給薪日期 */}
          <div className='flex flex-col flex-1'>
            <div className='flex flex-col gap-0.5 pt-2 mb-2'>
              <div className='flex justify-between items-center text-sm text-neutral-dark font-medium'>
                <span>給薪日期</span>
              </div>
            </div>
            <DatePicker
              value={parseDateStr(payDate)}
              onChange={date => {
                const v = date ? formatDateStr(date) : '';
                setPayDate(v);
                setErrors(prev => ({ ...prev, payDate: undefined }));
              }}
              error={!!errors.payDate}
            />
            {errors.payDate && (
              <div className='pt-1 text-xs text-semantic-error'>
                {errors.payDate}
              </div>
            )}
          </div>

          {/* 展開進階選項 */}
          <div className='flex justify-end'>
            <button
              type='button'
              className='shrink-0 flex items-center gap-1 text-sm font-medium text-brand-blue hover:text-brand-blue-dark'
              onClick={handleToggleExpanded}
            >
              {isExpanded ? '收合進階選項' : '展開進階選項'}
              {isExpanded ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
          </div>

          {/* 進階欄位 */}
          {isExpanded && (
            <div className='flex flex-col gap-4'>
              <div className='flex flex-col gap-3 pt-2 border-t border-surface-cream'>
                <p className='text-sm font-medium text-neutral-dark'>
                  保險投保級距
                  <span className='ml-1.5 text-xs font-normal text-neutral-dark/40'>
                    （選填）
                  </span>
                </p>

                {gradesLoading ? (
                  <p className='text-xs text-neutral-dark/40'>
                    載入級距資料中…
                  </p>
                ) : (
                  <>
                    <div className='flex gap-3 items-end'>
                      <div className='flex flex-col gap-1 flex-1'>
                        <label className='text-sm font-medium text-neutral-dark'>
                          健保投保金額
                        </label>
                        <Select
                          value={nhiGradeId}
                          onValueChange={val => {
                            setNhiGradeId(val);
                            setNhiGradeManuallySet(true);
                          }}
                        >
                          <option value=''>請選擇健保投保金額</option>
                          {nhiGrades.map(grade => (
                            <option key={grade.id} value={String(grade.id)}>
                              {formatGradeLabel(
                                grade.salaryMin,
                                grade.salaryMax
                              )}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className='w-24 shrink-0'>
                        <Field
                          label='扶養人數'
                          type='number'
                          value={nhiDependents}
                          onChange={e =>
                            setNhiDependents(
                              String(Math.max(0, Number(e.target.value)))
                            )
                          }
                          min='0'
                          placeholder='0'
                        />
                      </div>
                    </div>

                    <div className='flex flex-col gap-1'>
                      <label className='text-sm font-medium text-neutral-dark'>
                        勞保投保金額
                      </label>
                      <Select
                        value={laborGradeId}
                        onValueChange={val => {
                          setLaborGradeId(val);
                          setLaborGradeManuallySet(true);
                        }}
                      >
                        <option value=''>請選擇勞保投保金額</option>
                        {laborGrades
                          .filter(g => !g.isParttime)
                          .map(grade => (
                            <option key={grade.id} value={String(grade.id)}>
                              {formatGradeLabel(
                                grade.salaryMin,
                                grade.salaryMax
                              )}
                            </option>
                          ))}
                      </Select>
                    </div>

                    <div className='flex flex-col gap-2 py-2'>
                      <div
                        className='flex items-center gap-2 cursor-pointer'
                        onClick={() => setHasVoluntaryPension(v => !v)}
                      >
                        <Checkbox
                          checked={hasVoluntaryPension}
                          onChange={() => setHasVoluntaryPension(v => !v)}
                          aria-label='有勞工退休金自提'
                        />
                        <span className='text-sm font-medium text-neutral-dark'>
                          有勞工退休金自提
                        </span>
                      </div>

                      {hasVoluntaryPension && (
                        <div className='flex gap-3'>
                          <div className='flex flex-col gap-1 flex-1 pt-2'>
                            <label className='text-sm font-medium text-neutral-dark'>
                              勞退月提薪資
                            </label>
                            <Select
                              value={pensionGradeId}
                              onValueChange={setPensionGradeId}
                            >
                              <option value=''>請選擇勞退月提薪資</option>
                              {pensionGrades.map(grade => (
                                <option key={grade.id} value={String(grade.id)}>
                                  {formatGradeLabel(
                                    grade.salaryMin,
                                    grade.salaryMax
                                  )}
                                </option>
                              ))}
                            </Select>
                          </div>

                          <div className='flex flex-col gap-1 w-28 shrink-0 pt-2'>
                            <label className='text-sm font-medium text-neutral-dark'>
                              自提比例
                            </label>
                            <Select
                              value={voluntaryPensionRate}
                              onValueChange={setVoluntaryPensionRate}
                            >
                              <option value=''>選擇%</option>
                              {[1, 2, 3, 4, 5, 6].map(rate => (
                                <option key={rate} value={String(rate)}>
                                  {rate}%
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 手機版：計算結果 inline（桌面版 hidden，結果出現後才顯示） */}
        {result && (
          <div
            ref={resultSectionRef}
            className='md:hidden mt-4 pt-4 border-t border-surface-cream flex flex-col gap-3'
          >
            {/* 重新計算按鈕置於輸入區塊正下方，方便修改後立即重算 */}
            <button
              onClick={handleCalculate}
              disabled={calcBtnDisabled}
              className={calcBtnClass}
            >
              {loading ? '計算中...' : '重新計算薪資'}
            </button>
            <h2 className='text-base font-semibold text-neutral-dark'>
              薪資計算結果
            </h2>
            <div className='flex flex-col gap-1'>
              {[
                { label: '薪資扣繳', amount: result.withholding },
                {
                  label: '勞保費',
                  amount: result.laborInsurance.employeeAmount,
                },
                {
                  label: '健保費',
                  amount: result.healthInsurance.employeeAmount,
                },
                { label: '勞退自提', amount: result.volPension },
              ].map(item => (
                <div
                  key={item.label}
                  className='flex justify-between items-center py-2 border-b border-surface-cream'
                >
                  <span className='text-sm text-neutral-dark'>
                    {item.label}
                  </span>
                  <span className='font-semibold text-neutral-dark'>
                    $ {formatAmount(item.amount)}
                  </span>
                </div>
              ))}
              <div className='flex justify-between items-start py-2 border-b border-surface-cream'>
                <span className='text-sm text-neutral-dark'>二代健保</span>
                <div className='text-right'>
                  <span className='font-semibold text-neutral-dark block'>
                    $ {formatAmount(result.nhiSupplementary?.fee ?? 0)}
                  </span>
                  {result.nhiSupplementary?.required === false && (
                    <span className='text-xs text-neutral-dark/40'>
                      無需繳納
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className='flex flex-col gap-2'>
              <SalaryDocumentPreview
                salary={salary}
                company={company}
                contact={contact}
                taxId={taxId}
                variant='white'
              />
            </div>
            <div className='flex flex-col gap-2'>
              <p className='text-xs font-semibold text-neutral-dark/70'>
                注意：
              </p>
              {NOTES.map((note, i) => (
                <p
                  key={i}
                  className='text-xs text-neutral-dark/50 leading-relaxed pl-3 -indent-3'
                >
                  • {note}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* 手機版：固定底部按鈕（計算前 → 計算薪資；計算後 → 下一步） */}
        <MobileFixedBottom className='md:hidden'>
          {!result ? (
            <button
              onClick={handleCalculate}
              disabled={calcBtnDisabled}
              className={calcBtnClass}
            >
              {loading ? '計算中...' : '計算薪資'}
            </button>
          ) : (
            <button
              onClick={() => dispatch({ type: 'NEXT_STEP' })}
              className={`${btnPrimaryDisableable} w-full`}
            >
              下一步
            </button>
          )}
        </MobileFixedBottom>

        {/* 桌面版：計算按鈕（靜態，在表單欄底部） */}
        <div className='hidden md:block mt-auto pt-6'>
          <button
            onClick={handleCalculate}
            disabled={calcBtnDisabled}
            className={calcBtnClass}
          >
            {loading ? '計算中...' : result ? '重新計算薪資' : '計算薪資'}
          </button>
        </div>
      </div>
    </div>
  );
}
