import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { SETTINGS_PROJECTS, SETTINGS_TAGS } from '../data';

export default function TagsProjectsTab() {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-dark">
              專案管理 <span className="text-xs font-normal text-neutral-mid">使用 @ 符號標示</span>
            </h2>
          </div>
          <Button size="sm" icon={Plus}>
            新增專案
          </Button>
        </div>
        <div className="flex flex-wrap gap-3">
          {SETTINGS_PROJECTS.map(project => (
            <div
              key={project.id}
              className="w-full rounded-md border border-neutral-blue-gray/30 bg-white p-4 nav:w-[calc(50%-0.375rem)]"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-semibold text-neutral-dark">
                  <span className="text-brand-tan">@</span> {project.name}
                </span>
                <div className="flex items-center gap-3 text-neutral-mid">
                  <Pencil size={14} />
                  <Trash2 size={14} className="text-semantic-error" />
                </div>
              </div>
              <Badge tone="success" className="mb-3">
                {project.status}
              </Badge>
              <div className="flex flex-col gap-1 text-xs text-neutral-mid">
                <div>開始日期　{project.startDate}</div>
                <div>結束日期　{project.endDate}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-neutral-dark">
            標籤管理 <span className="text-xs font-normal text-neutral-mid">使用 # 符號標示</span>
          </h2>
          <Button size="sm" icon={Plus}>
            新增標籤
          </Button>
        </div>
        <div className="flex flex-wrap gap-3">
          {SETTINGS_TAGS.map(tag => (
            <div
              key={tag.id}
              className="flex w-full items-center justify-between gap-2 rounded-md border border-neutral-blue-gray/30 bg-white p-4 nav:w-[calc(33.333%-0.5rem)]"
            >
              <span className="font-semibold text-neutral-dark">
                <span className="text-brand-tan">#</span> {tag.name}
              </span>
              <div className="flex items-center gap-3 text-neutral-mid">
                <Pencil size={14} />
                <Trash2 size={14} className="text-semantic-error" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
