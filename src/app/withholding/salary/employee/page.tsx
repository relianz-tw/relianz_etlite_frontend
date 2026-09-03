import EmployeeListView from '@/features/withholding/salary/EmployeeListView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '員工列表 | Easytax Lite',
};

export default function EmployeePage() {
  return <EmployeeListView />;
}
