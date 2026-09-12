import api from './axios';

export const exportAPI = {
  exportTransactions: async (from?: string, to?: string): Promise<Blob> => {
    const response = await api.get('/export/transactions', {
      params: { from, to },
      responseType: 'blob',
    });
    return response.data;
  },

  exportAccounts: async (): Promise<Blob> => {
    const response = await api.get('/export/accounts', { responseType: 'blob' });
    return response.data;
  },

  exportGoals: async (): Promise<Blob> => {
    const response = await api.get('/export/goals', { responseType: 'blob' });
    return response.data;
  },
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
