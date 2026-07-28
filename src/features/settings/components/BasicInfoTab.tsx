'use client';

import TextInput from '@/components/ui/TextInput';
import { Check, KeyRound, Pencil, X } from 'lucide-react';
import { useState } from 'react';
import {
  BASIC_INFO_ADDRESS,
  BASIC_INFO_CONTACT,
  BASIC_INFO_EMAIL,
  BASIC_INFO_FIELDS,
  BASIC_INFO_LABOR_RISK,
  BASIC_INFO_ZIP,
} from '../data';
import type { BasicInfoField } from '../data';
import ChangePasswordDialog from './ChangePasswordDialog';

interface Snapshot {
  fields: BasicInfoField[];
  zip: string;
  address: string;
  laborRisk: string;
  contact: BasicInfoField[];
  email: string;
}

export default function BasicInfoTab() {
  const [fields, setFields] = useState<BasicInfoField[]>(BASIC_INFO_FIELDS);
  const [zip, setZip] = useState(BASIC_INFO_ZIP);
  const [address, setAddress] = useState(BASIC_INFO_ADDRESS);
  const [laborRisk, setLaborRisk] = useState(BASIC_INFO_LABOR_RISK);
  const [contact, setContact] = useState<BasicInfoField[]>(BASIC_INFO_CONTACT);
  const [email, setEmail] = useState(BASIC_INFO_EMAIL);

  const [editing, setEditing] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const updateField = (index: number, value: string) => setFields(list => list.map((f, i) => (i === index ? { ...f, value } : f)));
  const updateContact = (index: number, value: string) => setContact(list => list.map((f, i) => (i === index ? { ...f, value } : f)));

  const startEdit = () => {
    setSnapshot({ fields, zip, address, laborRisk, contact, email });
    setEditing(true);
  };
  const cancelEdit = () => {
    if (snapshot) {
      setFields(snapshot.fields);
      setZip(snapshot.zip);
      setAddress(snapshot.address);
      setLaborRisk(snapshot.laborRisk);
      setContact(snapshot.contact);
      setEmail(snapshot.email);
    }
    setEditing(false);
  };
  const saveEdit = () => setEditing(false);

  return (
    <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-neutral-dark">基本資料</h2>
        <div className="flex items-center gap-4 text-sm">
          {editing ? (
            <>
              <button type="button" onClick={cancelEdit} className="flex items-center gap-1.5 text-neutral-mid hover:text-neutral-dark">
                <X size={14} />
                取消
              </button>
              <button type="button" onClick={saveEdit} className="flex items-center gap-1.5 font-semibold text-brand-blue">
                <Check size={14} />
                儲存
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={startEdit} className="flex items-center gap-1.5 text-brand-blue">
                <Pencil size={14} />
                編輯基本資料
              </button>
              <button type="button" onClick={() => setPasswordDialogOpen(true)} className="flex items-center gap-1.5 text-brand-blue">
                <KeyRound size={14} />
                變更密碼
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-5 nav:grid-cols-2">
        {fields.map((field, i) => (
          <div key={field.label}>
            <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">{field.label}</label>
            <TextInput value={field.value} onChange={e => updateField(i, e.target.value)} disabled={!editing} readOnly={!editing} />
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-5 nav:grid-cols-[120px_1fr]">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">郵遞區號</label>
          <TextInput value={zip} onChange={e => setZip(e.target.value)} disabled={!editing} readOnly={!editing} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">登記地址</label>
          <TextInput value={address} onChange={e => setAddress(e.target.value)} disabled={!editing} readOnly={!editing} />
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">職災費率類別</label>
        <TextInput value={laborRisk} onChange={e => setLaborRisk(e.target.value)} disabled={!editing} readOnly={!editing} />
      </div>

      <div className="mt-6 rounded-md bg-surface-cream p-4">
        <h3 className="mb-4 text-sm font-semibold text-neutral-dark">聯絡資訊</h3>
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 nav:grid-cols-2">
          {contact.map((field, i) => (
            <div key={field.label}>
              <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">{field.label}</label>
              <TextInput value={field.value} onChange={e => updateContact(i, e.target.value)} disabled={!editing} readOnly={!editing} />
            </div>
          ))}
        </div>
        <div className="mt-5">
          <label className="mb-1.5 block text-sm font-semibold text-neutral-dark">電子郵件信箱</label>
          <TextInput value={email} onChange={e => setEmail(e.target.value)} disabled={!editing} readOnly={!editing} />
        </div>
      </div>

      <ChangePasswordDialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} />
    </div>
  );
}
