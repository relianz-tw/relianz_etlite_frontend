'use client';

import Modal from '@/components/ui/Modal';
import type { SalesRow } from '../types';
import AllowanceInvoiceDetail from './AllowanceInvoiceDetail';

interface AllowanceDialogProps {
  open: boolean;
  onClose: () => void;
  row: SalesRow | null;
}

export default function AllowanceDialog({ open, onClose, row }: AllowanceDialogProps) {
  if (!open || !row) return null;
  return (
    <Modal open onClose={onClose} title={`折讓 — ${row.id}`} widthClassName="max-w-[720px]">
      <AllowanceInvoiceDetail />
    </Modal>
  );
}
