import { fetchApi, API_URL, getAccessToken, setAccessToken, getRefreshToken, setRefreshToken, clearTokens } from './client';
import { auth } from './auth';
import { settings } from './settings';
import { users } from './users';
import { clients } from './clients';
import { projects } from './projects';
import { invoices } from './invoices';
import { quotations } from './quotations';
import { files } from './files';
import { notifications } from './notifications';
import { workflow } from './workflow';

export const api = {
  ...auth,
  ...settings,
  ...users,
  ...clients,
  ...projects,
  ...invoices,
  ...quotations,
  ...files,
  ...notifications,
  ...workflow,
  setAccessToken
};

export {
  fetchApi,
  API_URL,
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  clearTokens
};
