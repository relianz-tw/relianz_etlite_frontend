import EmployeeFormView from '@/features/withholding/salary/EmployeeFormView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '編輯員工 | Easytax Lite',
};

// EmployeeFormView 內部依 employeeId 自行呼叫 API 讀取員工資料，本頁只負責把網址參數往下傳遞
export default function EditEmployeePage({ params }: { params: { id: string } }) {
  return <EmployeeFormView employeeId={params.id} />;
}
