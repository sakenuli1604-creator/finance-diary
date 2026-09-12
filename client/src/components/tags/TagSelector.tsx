import React, { useEffect, useState } from 'react';
import { Plus, X, Briefcase } from 'lucide-react';
import { useTagsStore } from '../../store/tagsStore';

interface TagSelectorProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export const TagSelector: React.FC<TagSelectorProps> = ({ selectedTagIds, onChange }) => {
  const { tags, fetchTags, createTag } = useTagsStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagIsProject, setNewTagIsProject] = useState(false);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newTagName.trim().replace(/^#/, '');
    if (!name) return;
    try {
      const tag = await createTag({ name, isProject: newTagIsProject });
      onChange([...selectedTagIds, tag.id]);
      setNewTagName('');
      setNewTagIsProject(false);
      setIsAdding(false);
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-secondary mb-2">
        Теги (необязательно)
      </label>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const selected = selectedTagIds.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className="px-3 py-1 rounded-full text-sm font-medium transition-colors border"
              style={
                selected
                  ? { backgroundColor: tag.color, borderColor: tag.color, color: '#fff' }
                  : { borderColor: 'rgb(var(--color-border))' }
              }
              title={tag.isProject ? 'Проектный тег — учитывается отдельно от обычных расходов' : undefined}
            >
              {tag.isProject && <Briefcase size={12} className="inline mr-1 -mt-0.5" />}
              #{tag.name}
            </button>
          );
        })}

        {isAdding ? (
          <form onSubmit={handleCreate} className="flex items-center gap-2">
            <input
              autoFocus
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="название"
              className="w-28 px-2 py-1 text-sm border border-line rounded-full outline-none bg-surface text-primary"
            />
            <label className="flex items-center gap-1 text-xs text-secondary whitespace-nowrap">
              <input
                type="checkbox"
                checked={newTagIsProject}
                onChange={(e) => setNewTagIsProject(e.target.checked)}
              />
              проект
            </label>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewTagName('');
                setNewTagIsProject(false);
              }}
              className="text-secondary hover:text-primary"
            >
              <X size={16} />
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="px-3 py-1 rounded-full text-sm font-medium bg-muted text-secondary hover:text-primary flex items-center gap-1"
          >
            <Plus size={14} />
            Новый тег
          </button>
        )}
      </div>
    </div>
  );
};
