import ProgressBar from '@/components/ui/ProgressBar';

export interface StepProgressValue {
  value: number;
  max: number;
}

/** 步驟 4 逐頁核對的進度條與說明文字（申報書頁、登記資料頁、負責人頁共用） */
export function StepProgress({ value, max }: StepProgressValue) {
  return (
    <div className='flex flex-col gap-1.5'>
      <ProgressBar value={value} max={max} label='資料進度' />
      <span className='text-xs text-neutral-mid'>
        {value === 0 ? `封面填完後，接下來逐頁核對 ${max} 份資料` : `共 ${max} 份資料逐頁核對，已走到第 ${value} 份`}
      </span>
    </div>
  );
}
