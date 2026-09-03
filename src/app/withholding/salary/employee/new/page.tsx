import EmployeeFormView from '@/features/withholding/salary/EmployeeFormView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '新增員工 | Easytax Lite',
};

export default function NewEmployeePage() {
  return <EmployeeFormView />;
}
