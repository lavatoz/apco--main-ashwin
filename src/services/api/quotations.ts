import { fetchApi, checkClientBlock } from './client';
import { type Invoice } from '../../types';
import { mapFromBackendInvoice, mapToBackendInvoice } from './invoices';

function isUuid(str: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export const quotations = {
  getQuoteById: async (id: string): Promise<Invoice> => {
    console.log('[API] Looking for Quote:', id);
    if (isUuid(id)) {
      const resp = await fetchApi(`/quotations/${id}`);
      return mapFromBackendInvoice(resp);
    } else {
      throw new Error(`404: Quotation ID '${id}' is not a valid UUID.`);
    }
  },

  saveQuote: async (quote: Invoice): Promise<Invoice> => {
    checkClientBlock("Create/Edit Quote");
    const payload = mapToBackendInvoice(quote);
    const id = quote.id || quote._id;

    let result;
    if (id && isUuid(id)) {
      result = await fetchApi(`/quotations/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      result = await fetchApi('/quotations', { method: 'POST', body: JSON.stringify(payload) });
    }
    return mapFromBackendInvoice(result);
  }
};
