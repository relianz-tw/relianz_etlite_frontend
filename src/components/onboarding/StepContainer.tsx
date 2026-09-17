interface StepContainerProps {
  /** 左欄（資訊區）內容，綠色背景 */
  infoSlot: React.ReactNode;
  /** 右欄（操作區）內容，白色背景 */
  actionSlot: React.ReactNode;
}

/**
 * 單步驟容器，管理左右欄 slot
 * 桌面：左資訊（綠）| 右操作（白）
 * 手機：操作區在上，資訊區在下（CSS order 實作）
 */
export function StepContainer({ infoSlot, actionSlot }: StepContainerProps) {
  return (
    <div className='flex flex-col md:flex-row flex-1 min-h-0'>
      {/* 左欄資訊區（綠色），手機排序在下 */}
      <div className='order-2 md:order-1 w-full md:w-2/5 bg-semantic-success text-white flex flex-col p-5 md:p-12 overscroll-none'>
        {infoSlot}
      </div>

      {/* 右欄操作區（白色），手機排序在上 */}
      <div className='order-1 md:order-2 w-full md:w-3/5 bg-white flex flex-col p-5 md:p-12 overflow-y-auto overscroll-none'>
        {actionSlot}
      </div>
    </div>
  );
}
