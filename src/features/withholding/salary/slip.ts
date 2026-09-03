import { fmtCurrency } from '@/lib/utils';
import { calculatePayable } from './calc';
import type { PayrollItem } from './types';

/**
 * 下載薪資條：原專案以 html2canvas 產生每位員工的薪資條圖片並打包成 ZIP，
 * 無此類套件時改為產出單一純文字檔彙整所有人員薪資明細，供示意使用。
 */
export function downloadSalarySlips(year: number, month: number, items: PayrollItem[]): void {
  const lines: string[] = [`${year - 1911} 年 ${month} 月薪資發放明細`, ''];

  items.forEach(item => {
    lines.push(`姓名：${item.name}　身分證字號：${item.idNumber}`);
    lines.push(`固定薪資：${fmtCurrency(item.fixedSalary)}　非固定薪資：${fmtCurrency(item.nonFixedSalary)}`);
    lines.push(`免稅加班費：${fmtCurrency(item.overtimePay)}　免稅伙食費：${fmtCurrency(item.mealAllowance)}`);
    item.customItems.forEach(c => lines.push(`${c.name}：${c.isDeduction ? '-' : ''}${fmtCurrency(c.amount)}`));
    lines.push(
      `扣繳：薪資扣繳稅款 ${fmtCurrency(item.withholding)}、勞保費 ${fmtCurrency(item.laborEmployeeAmount)}、健保費 ${fmtCurrency(item.nhiEmployeeAmount)}、二代健保 ${fmtCurrency(item.secondHealthInsuranceFee)}、勞退自提 ${fmtCurrency(item.selfPension)}、請假/遲到/早退 ${fmtCurrency(item.leaveDeduction)}`,
    );
    lines.push(`實領金額：${fmtCurrency(calculatePayable(item))}`);
    lines.push('');
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${year - 1911}年${month}月_薪資條.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
