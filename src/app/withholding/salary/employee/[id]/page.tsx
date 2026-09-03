import EmployeeFormView from '@/features/withholding/salary/EmployeeFormView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '編輯員工 | Easytax Lite',
};

// 員工假資料僅存於瀏覽器端記憶體，EmployeeFormView 內部依 employeeId 自行從 mockStore 讀取，
// 本頁只負責把網址參數往下傳遞
export default function EditEmployeePage({ params }: { params: { id: string } }) {
  return <EmployeeFormView employeeId={params.id} />;
}
