'use client';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { SETTINGS_PROJECTS, SETTINGS_TAGS } from '../data';
import type { ProjectRecord, TagRecord } from '../data';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import ProjectDialog from './ProjectDialog';
import TagDialog from './TagDialog';

export default function TagsProjectsTab() {
  const [projects, setProjects] = useState<ProjectRecord[]>(SETTINGS_PROJECTS);
  const [tags, setTags] = useState<TagRecord[]>(SETTINGS_TAGS);

  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectRecord | undefined>(undefined);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);

  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagRecord | undefined>(undefined);
  const [deleteTagId, setDeleteTagId] = useState<string | null>(null);

  const openNewProject = () => {
    setEditingProject(undefined);
    setProjectDialogOpen(true);
  };
  const openEditProject = (project: ProjectRecord) => {
    setEditingProject(project);
    setProjectDialogOpen(true);
  };
  const handleProjectSubmit = (data: Omit<ProjectRecord, 'id'>) => {
    if (editingProject) {
      setProjects(list => list.map(p => (p.id === editingProject.id ? { ...editingProject, ...data } : p)));
    } else {
      setProjects(list => [...list, { ...data, id: `p${list.length + 1}` }]);
    }
  };
  const handleProjectDelete = () => {
    if (!deleteProjectId) return;
    setProjects(list => list.filter(p => p.id !== deleteProjectId));
  };

  const openNewTag = () => {
    setEditingTag(undefined);
    setTagDialogOpen(true);
  };
  const openEditTag = (tag: TagRecord) => {
    setEditingTag(tag);
    setTagDialogOpen(true);
  };
  const handleTagSubmit = (name: string) => {
    if (editingTag) {
      setTags(list => list.map(t => (t.id === editingTag.id ? { ...t, name } : t)));
    } else {
      setTags(list => [...list, { id: `t${list.length + 1}`, name }]);
    }
  };
  const handleTagDelete = () => {
    if (!deleteTagId) return;
    setTags(list => list.filter(t => t.id !== deleteTagId));
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-md border border-neutral-blue-gray/30 bg-white p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-dark">
              專案管理 <span className="text-xs font-normal text-neutral-mid">使用 @ 符號標示</span>
            </h2>
          </div>
          <Button size="sm" icon={Plus} onClick={openNewProject}>
            新增專案
          </Button>
        </div>
        <div className="flex flex-wrap gap-3">
          {projects.map(project => (
            <div
              key={project.id}
              className="w-full rounded-md border border-neutral-blue-gray/30 bg-white p-4 nav:w-[calc(50%-0.375rem)]"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-semibold text-neutral-dark">
                  <span className="text-brand-tan">@</span> {project.name}
                </span>
                <div className="flex items-center gap-3 text-neutral-mid">
                  <button type="button" onClick={() => openEditProject(project)} aria-label={`編輯專案 ${project.name}`}>
                    <Pencil size={14} />
                  </button>
                  <button type="button" onClick={() => setDeleteProjectId(project.id)} aria-label={`刪除專案 ${project.name}`}>
                    <Trash2 size={14} className="text-semantic-error" />
                  </button>
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
          <Button size="sm" icon={Plus} onClick={openNewTag}>
            新增標籤
          </Button>
        </div>
        <div className="flex flex-wrap gap-3">
          {tags.map(tag => (
            <div
              key={tag.id}
              className="flex w-full items-center justify-between gap-2 rounded-md border border-neutral-blue-gray/30 bg-white p-4 nav:w-[calc(33.333%-0.5rem)]"
            >
              <span className="font-semibold text-neutral-dark">
                <span className="text-brand-tan">#</span> {tag.name}
              </span>
              <div className="flex items-center gap-3 text-neutral-mid">
                <button type="button" onClick={() => openEditTag(tag)} aria-label={`編輯標籤 ${tag.name}`}>
                  <Pencil size={14} />
                </button>
                <button type="button" onClick={() => setDeleteTagId(tag.id)} aria-label={`刪除標籤 ${tag.name}`}>
                  <Trash2 size={14} className="text-semantic-error" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ProjectDialog open={projectDialogOpen} onClose={() => setProjectDialogOpen(false)} onSubmit={handleProjectSubmit} initial={editingProject} />
      <ConfirmDeleteDialog
        open={deleteProjectId !== null}
        onClose={() => setDeleteProjectId(null)}
        onConfirm={handleProjectDelete}
        title="刪除專案"
        message="確定要刪除此專案嗎？此動作無法復原。"
      />

      <TagDialog open={tagDialogOpen} onClose={() => setTagDialogOpen(false)} onSubmit={handleTagSubmit} initialName={editingTag?.name} />
      <ConfirmDeleteDialog
        open={deleteTagId !== null}
        onClose={() => setDeleteTagId(null)}
        onConfirm={handleTagDelete}
        title="刪除標籤"
        message="確定要刪除此標籤嗎？此動作無法復原。"
      />
    </div>
  );
}
