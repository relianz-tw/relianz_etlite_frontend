import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface SectionCardProps {
  /** 卡片標題，不傳時不顯示標題列（純內容卡片） */
  title?: string;
  icon?: LucideIcon;
  /** 標題列右側附加內容（如載入中提示文字） */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** 表單分區卡片：白底、圓角、細邊框（見 DESIGN.md「Cards & Containers」），
 *  供多張卡片垂直堆疊組成的長表單（如新增勞報單、員工設定）共用，避免各表單各自複製容器樣式 */
export default function SectionCard({ title, icon: Icon, action, className = '', children }: SectionCardProps) {
  return (
    <div className={`flex flex-col gap-3 rounded-lg border border-neutral-blue-gray/30 bg-white p-5 ${className}`}>
      {title && (
        <div className="flex items-center justify-between text-base font-semibold text-neutral-dark">
          <span className="flex items-center gap-2">
            {title}
            {Icon && <Icon size={18} className="text-brand-blue" />}
          </span>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
