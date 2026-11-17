import type { CloudFileMap } from '../mockCloudFiles';
import type { FileSlotDef } from '../slots';
import FileSlot from './FileSlot';

interface SlotListProps {
  slots: FileSlotDef[];
  files: CloudFileMap;
  /** 組出 slotKey 的前綴，各 tab 自行決定（如 `vat:2026:1`） */
  keyPrefix: string;
  onUpload: (slotKey: string, file: File) => void;
}

/** 一組檔案格的垂直清單，三個 tab 共用 */
export default function SlotList({ slots, files, keyPrefix, onUpload }: SlotListProps) {
  return (
    <div className="flex flex-col gap-4">
      {slots.map(slot => {
        const key = `${keyPrefix}:${slot.code}`;
        return <FileSlot key={slot.code} title={slot.title} file={files[key]} onUpload={f => onUpload(key, f)} />;
      })}
    </div>
  );
}
