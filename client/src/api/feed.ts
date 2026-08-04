import api from './axios';
import { FeedEvent } from '../types';

export const feedAPI = {
  getFeed: async (limit = 20): Promise<FeedEvent[]> => {
    const response = await api.get<FeedEvent[]>('/feed', { params: { limit } });
    return response.data;
  },
};
