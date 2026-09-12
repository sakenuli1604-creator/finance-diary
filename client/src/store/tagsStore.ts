import { create } from 'zustand';
import { Tag } from '../types';
import { tagsAPI, CreateTagData } from '../api/tags';

interface TagsState {
  tags: Tag[];
  isLoading: boolean;
  fetchTags: () => Promise<void>;
  createTag: (data: CreateTagData) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;
}

export const useTagsStore = create<TagsState>((set, get) => ({
  tags: [],
  isLoading: false,

  fetchTags: async () => {
    try {
      set({ isLoading: true });
      const tags = await tagsAPI.getAll();
      set({ tags, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  createTag: async (data) => {
    const tag = await tagsAPI.create(data);
    // create() на бэкенде переиспользует существующий тег с тем же именем —
    // поэтому просто освежаем список, а не слепо добавляем в конец
    set({ tags: [...get().tags.filter((t) => t.id !== tag.id), tag].sort((a, b) => a.name.localeCompare(b.name)) });
    return tag;
  },

  deleteTag: async (id) => {
    await tagsAPI.delete(id);
    set({ tags: get().tags.filter((t) => t.id !== id) });
  },
}));
