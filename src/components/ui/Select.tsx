'use client';

import { Check, ChevronDown } from 'lucide-react';
import { Children, isValidElement, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

interface SelectProps {
  widthClassName?: string;
  className?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  children: ReactNode;
}

interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

interface PanelPosition {
  top: number;
  left: number;
  width: number;
  openUp: boolean;
}

/** 解析 <option> children，比照原生 select：無 value 屬性時以文字內容作為值 */
function parseOptions(children: ReactNode): SelectOption[] {
  return Children.toArray(children)
    .filter(isValidElement)
    .filter(child => child.type === 'option')
    .map(child => {
      const props = child.props as { value?: string; children?: ReactNode; disabled?: boolean };
      const label = props.children;
      const value = props.value ?? (typeof label === 'string' ? label : String(label));
      return { value, label, disabled: props.disabled };
    });
}

export default function Select({
  widthClassName = 'w-full',
  className = '',
  value: controlledValue,
  defaultValue,
  disabled,
  onValueChange,
  children,
}: SelectProps) {
  const options = parseOptions(children);
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? options[0]?.value ?? '');
  const value = controlledValue ?? internalValue;
  const [position, setPosition] = useState<PanelPosition | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // 展開下拉選單時，以視窗座標定位面板並透過 portal 掛載到 body，避免被表格 overflow-hidden 裁切
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const estimatedPanelHeight = Math.min(options.length * 36 + 8, 256);
    const openUp = window.innerHeight - rect.bottom < estimatedPanelHeight && rect.top > estimatedPanelHeight;
    setPosition({
      top: (openUp ? rect.top - 4 : rect.bottom + 4) + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      openUp,
    });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const selectedLabel = options.find(o => o.value === value)?.label ?? value;

  return (
    <div className={`min-w-0 ${widthClassName}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-lg border-[1.5px] border-neutral-blue-gray/50 bg-white px-3 text-sm text-neutral-dark outline-none transition-colors focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/15 disabled:cursor-not-allowed disabled:bg-surface-cream disabled:text-neutral-mid ${className}`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown size={15} className={`shrink-0 text-neutral-mid transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            role="listbox"
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
              transform: position.openUp ? 'translateY(-100%)' : undefined,
            }}
            className="absolute z-[80] max-h-64 overflow-auto rounded-lg border border-neutral-blue-gray/30 bg-white py-1 shadow-level1"
          >
            {options.map(option => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                disabled={option.disabled}
                onClick={() => {
                  if (controlledValue === undefined) setInternalValue(option.value);
                  onValueChange?.(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 truncate px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:text-neutral-mid ${
                  option.value === value ? 'bg-brand-blue/10 font-semibold text-brand-blue' : 'text-neutral-dark hover:bg-surface-cream'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value && <Check size={14} className="shrink-0" />}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
