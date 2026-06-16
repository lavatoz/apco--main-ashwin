import { fetchApi, checkClientBlock } from './client';
import { type Invoice, type Expense } from '../../types';

function isUuid(str: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export function mapToBackendInvoice(invoice: Invoice) {
  const isQuote = invoice.isQuotation || invoice.type === 'quotation';
  
  let projectId = (invoice as any).projectId || (invoice.project?.id || invoice.project || '');
  if (!projectId || projectId === 'All' || !isUuid(projectId)) {
    projectId = '00000000-0000-0000-0000-000000000000';
  }

  let clientId = invoice.clientId || (invoice.client?.id || invoice.client || '');
  if (!clientId || !isUuid(clientId)) {
    clientId = '00000000-0000-0000-0000-000000000000';
  }

  const payload: any = {
    projectId,
    clientId,
    amount: Number(invoice.totalAmount || invoice.amount || 0),
    status: invoice.status || 'Draft',
    dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString() : new Date().toISOString(),
    discountValue: invoice.discountValue !== undefined ? Number(invoice.discountValue) : null,
    discountType: invoice.discountType || null,
    taxPercent: invoice.taxPercent !== undefined ? Number(invoice.taxPercent) : null,
    shippingCost: invoice.shippingCost !== undefined ? Number(invoice.shippingCost) : null,
    notes: invoice.notes || null,
    termsSummary: invoice.termsSummary || null,
    companyLogoUrl: invoice.companyLogoUrl || null,
    paymentTerms: invoice.paymentTerms || null,
    templateId: invoice.templateId || null,
    templateVersion: invoice.templateVersion || null,
    brandId: invoice.brandId || null,
    brand: invoice.brand || null,
    items: (invoice.items || []).map(item => {
      const price = item.price !== undefined ? item.price : (item.rate || 0);
      return {
        description: item.description || 'Line Item',
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(price),
        amount: Number(price) * (Number(item.quantity) || 1),
      };
    })
  };

  if (isQuote) {
    payload.validUntil = payload.dueDate;
  }

  return payload;
}

export function mapFromBackendInvoice(backend: any): Invoice {
  const isQuotation = backend.quotationNumber !== undefined || backend.validUntil !== undefined;
  
  const items = (backend.items || []).map((item: any) => ({
    id: item.id,
    description: item.description,
    quantity: Number(item.quantity),
    price: Number(item.unitPrice || item.amount),
    total: Number(item.amount),
  }));

  const paymentHistory = (backend.payments || []).map((p: any) => ({
    id: p.id,
    amount: Number(p.amount),
    date: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  }));

  const baseAmount = Number(backend.amount || 0);
  const tax = Number(backend.taxPercent || 0);
  const discount = Number(backend.discountValue || 0);
  const shipping = Number(backend.shippingCost || 0);

  let totalAmount = baseAmount;
  if (backend.discountType === 'percent') {
    totalAmount = baseAmount - (baseAmount * discount / 100);
  } else {
    totalAmount = baseAmount - discount;
  }
  totalAmount = totalAmount + (totalAmount * tax / 100) + shipping;

  return {
    _id: backend.id,
    id: backend.id, // Keep the DB UUID as id
    clientId: backend.clientId,
    client: backend.client,
    project: backend.project,
    amount: baseAmount,
    totalAmount: totalAmount,
    paidAmount: paymentHistory.reduce((sum: number, p: any) => sum + p.amount, 0),
    paymentHistory,
    status: backend.status,
    type: isQuotation ? 'quotation' : 'invoice',
    isQuotation,
    items,
    brand: backend.brand,
    brandId: backend.brandId,
    createdAt: backend.createdAt,
    issueDate: backend.issuedAt || backend.createdAt,
    dueDate: backend.dueDate || backend.validUntil,
    companyLogoUrl: backend.companyLogoUrl,
    paymentTerms: backend.paymentTerms,
    taxPercent: tax,
    discountValue: discount,
    discountType: backend.discountType,
    shippingCost: shipping,
    notes: backend.notes,
    termsSummary: backend.termsSummary,
    templateId: backend.templateId,
    templateVersion: backend.templateVersion,
  };
}

export const invoices = {
  getInvoices: async (): Promise<Invoice[]> => {
    try {
      const [invs, quotes] = await Promise.all([
        fetchApi('/invoices').catch(() => []),
        fetchApi('/quotations').catch(() => [])
      ]);
      return [...invs.map(mapFromBackendInvoice), ...quotes.map(mapFromBackendInvoice)];
    } catch (err) {
      console.error("Failed to fetch invoices/quotations:", err);
      return [];
    }
  },

  saveInvoice: async (invoice: Invoice): Promise<Invoice> => {
    checkClientBlock("Create/Edit Invoice");
    const payload = mapToBackendInvoice(invoice);
    const id = invoice.id || invoice._id;
    
    let result;
    if (id && isUuid(id)) {
      result = await fetchApi(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      result = await fetchApi('/invoices', { method: 'POST', body: JSON.stringify(payload) });
    }
    return mapFromBackendInvoice(result);
  },

  deleteInvoice: async (id: string): Promise<void> => {
    checkClientBlock("Delete Invoice");
    if (isUuid(id)) {
      await fetchApi(`/invoices/${id}`, { method: 'DELETE' });
    } else {
      console.warn("Skipping deletion of mock/non-UUID invoice ID:", id);
    }
  },

  // Unified Finance Summary
  getFinanceSummary: async (projectId?: string, mode: 'global' | 'project' = 'project') => {
    console.log(`[FINANCE_SYNC] Fetching unified summary. Mode: ${mode}, ProjectId: ${projectId}`);
    
    const [allInvoices, allExpenses] = await Promise.all([
      invoices.getInvoices(),
      invoices.getExpenses()
    ]);

    let filteredInvoices = allInvoices;
    let filteredExpenses = allExpenses;

    if (mode === 'project' && projectId && projectId !== 'All') {
      filteredInvoices = allInvoices.filter(i => 
        i.brandId === projectId || 
        i.divisionId === projectId || 
        i.brand === projectId ||
        (i as any).companyName === projectId
      );
      filteredExpenses = allExpenses.filter(e => 
        e.divisionId === projectId || 
        e.brand === projectId || 
        e.clientId === projectId
      );
    }

    const isQuote = (i: Invoice) => i.isQuotation || i.type === 'quotation' || ['Quotation', 'Draft', 'Approved'].includes(i.status);
    const revenueInvoices = filteredInvoices.filter(i => !isQuote(i));
    const quotes = filteredInvoices.filter(i => isQuote(i));

    const totalRevenue = revenueInvoices.reduce((sum, inv) => {
      return sum + (inv.totalAmount || inv.amount || 0);
    }, 0);

    const recoveredAmount = revenueInvoices.reduce((sum, inv) => {
      if (inv.status === 'Paid') {
        return sum + (inv.totalAmount || inv.amount || 0);
      }
      return sum + (inv.paidAmount || 0);
    }, 0);

    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

    return {
      totalRevenue,
      recoveredAmount,
      pendingAmount: totalRevenue - recoveredAmount,
      totalExpenses,
      profit: totalRevenue - totalExpenses,
      invoices: revenueInvoices,
      quotes: quotes,
      expenses: filteredExpenses
    };
  },

  // Expenses
  getExpenses: async (): Promise<Expense[]> => {
    try {
      const result = await fetchApi('/finance/expenses');
      return (result || []).map((exp: any) => ({
        id: exp.id,
        description: exp.description,
        amount: Number(exp.amount),
        date: exp.date ? new Date(exp.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        category: exp.category,
        clientId: exp.clientId,
        client: exp.client?.name || undefined,
        brand: exp.brand,
        divisionId: exp.divisionId || undefined,
      }));
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
      return [];
    }
  },

  saveExpense: async (expense: Expense & { _id?: string }): Promise<Expense> => {
    checkClientBlock("Manage Expenses");
    const payload = {
      description: expense.description,
      amount: Number(expense.amount),
      category: expense.category,
      date: expense.date ? new Date(expense.date).toISOString() : new Date().toISOString(),
      clientId: expense.clientId || null,
      brand: expense.brand || 'All',
      divisionId: expense.divisionId || null,
    };

    const id = expense.id || expense._id;
    let result;
    if (id && isUuid(id)) {
      result = await fetchApi(`/finance/expenses/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      result = await fetchApi('/finance/expenses', { method: 'POST', body: JSON.stringify(payload) });
    }
    
    return {
      id: result.id,
      description: result.description,
      amount: Number(result.amount),
      date: result.date ? new Date(result.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      category: result.category,
      clientId: result.clientId,
      brand: result.brand,
      divisionId: result.divisionId,
    };
  },

  deleteExpense: async (id: string): Promise<void> => {
    checkClientBlock("Delete Expense");
    if (isUuid(id)) {
      await fetchApi(`/finance/expenses/${id}`, { method: 'DELETE' });
    } else {
      console.warn("Skipping deletion of mock/non-UUID expense ID:", id);
    }
  }
};
