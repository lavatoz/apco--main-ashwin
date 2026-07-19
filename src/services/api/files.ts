import { fetchApi, getAccessToken, API_URL } from './client';

const generateCorrelationId = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    try {
      return window.crypto.randomUUID();
    } catch {
      // fallback
    }
  }
  return 'corr-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now();
};

export const files = {
  getFilesByProject: async (projectId: string, category?: string) => {
    return fetchApi(`/files/project/${projectId}${category ? `?category=${category}` : ''}`);
  },

  uploadProjectFile: async (projectId: string, folderType: string, file: File, isSecured: boolean = false) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId);
    formData.append('folderType', folderType);
    formData.append('isSecured', String(isSecured));
    return fetchApi('/files/upload', {
      method: 'POST',
      body: formData
    });
  },

  uploadProjectFileWithProgress: (
    projectId: string,
    folderType: string,
    file: File,
    isSecured: boolean = false,
    onProgress: (percent: number) => void
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const token = getAccessToken();
      const correlationId = generateCorrelationId();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            resolve(xhr.responseText);
          }
        } else {
          try {
            const errData = JSON.parse(xhr.responseText);
            reject(new Error(errData.message || `Upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error during upload.')));
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted.')));

      xhr.open('POST', `${API_URL}/files/upload`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.setRequestHeader('X-Correlation-ID', correlationId);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);
      formData.append('folderType', folderType);
      formData.append('isSecured', String(isSecured));

      xhr.send(formData);
    });
  },

  downloadProjectFile: async (id: string, fileName: string) => {
    const blob = await fetchApi(`/files/${id}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  deleteProjectFile: async (id: string) => {
    return fetchApi(`/files/${id}`, {
      method: 'DELETE'
    });
  },

  // Phase 4 Scope Wrappers
  uploadFile: async (projectId: string, folderType: string, file: File, isSecured: boolean = false) => {
    return files.uploadProjectFile(projectId, folderType, file, isSecured);
  },

  downloadFile: async (id: string, fileName: string) => {
    return files.downloadProjectFile(id, fileName);
  },

  getFiles: async (projectId: string, category?: string) => {
    return files.getFilesByProject(projectId, category);
  },

  getProjectFiles: async (projectId: string, category?: string) => {
    return files.getFilesByProject(projectId, category);
  },

  deleteFile: async (id: string) => {
    return files.deleteProjectFile(id);
  },

  getFileBlob: async (id: string): Promise<Blob> => {
    return fetchApi(`/files/${id}/download`, { responseType: 'blob' });
  },

  getFileThumbnailBlob: async (id: string): Promise<Blob> => {
    return fetchApi(`/files/${id}/thumbnail`, { responseType: 'blob' });
  }
};
