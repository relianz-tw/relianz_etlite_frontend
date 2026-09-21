interface SplitPanelProps {
  /** 左欄內容；未傳入 right 時，左欄以單欄置中呈現（如損益表這種不需比對兩欄的報表） */
  left: React.ReactNode;
  right?: React.ReactNode;
}

/**
 * 開帳精靈報表核對頁共用的左右雙欄容器（步驟 3 封面頁、步驟 4 報表頁）。
 * 桌機左右各半版、白底、中間 1px 分隔線，各欄獨立捲動；手機單欄堆疊（比照既有 step 元件
 * md:overflow-y-auto 慣例，讓外層 InitializationLayout 的捲動容器在手機版接手捲動）。
 */
export function SplitPanel({ left, right }: SplitPanelProps) {
  if (!right) {
    return <div className='flex flex-col flex-1 min-h-0 mx-auto w-full max-w-2xl p-5 md:p-12 md:overflow-y-auto'>{left}</div>;
  }

  return (
    <div className='flex flex-col md:flex-row flex-1 min-h-0'>
      <div className='w-full md:w-1/2 md:min-h-0 md:overflow-y-auto p-5 md:p-12 md:border-r md:border-neutral-blue-gray/30'>{left}</div>
      <div className='w-full md:w-1/2 md:min-h-0 md:overflow-y-auto p-5 md:p-12'>{right}</div>
    </div>
  );
}
