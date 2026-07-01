import type { Client, Invoice, ActiveAgreementSnapshot, StandaloneAgreement } from '../types';

export interface AgreementPlaceholderData {
  client?: Partial<Client> | any;
  project?: any;
  quotation?: Partial<Invoice> | any;
  invoice?: Partial<Invoice> | any;
  agreement?: Partial<ActiveAgreementSnapshot> | Partial<StandaloneAgreement> | any;
  company?: any;
}

export const formatDateStr = (dateVal: any): string => {
  if (!dateVal) return '';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return typeof dateVal === 'string' ? dateVal : '';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export const formatCurrency = (amount: any): string => {
  if (amount === undefined || amount === null || amount === '') return '';
  const num = Number(amount);
  if (isNaN(num)) return '';
  return `Rs. ${num.toLocaleString('en-IN')}`;
};

export const replaceAgreementPlaceholders = (text: string, data: AgreementPlaceholderData = {}): string => {
  if (!text) return '';

  const clientName =
    data.client?.name ||
    data.client?.projectName ||
    data.quotation?.clientName ||
    data.quotation?.client?.name ||
    data.invoice?.clientName ||
    data.invoice?.client?.name ||
    data.project?.client?.name ||
    data.agreement?.quotation?.clientName ||
    '';

  const eventName =
    data.project?.name ||
    data.quotation?.eventName ||
    data.invoice?.eventName ||
    data.client?.projectName ||
    data.agreement?.quotation?.eventName ||
    '';

  const rawEventDate =
    data.quotation?.eventDate ||
    data.invoice?.eventDate ||
    data.project?.eventDate ||
    (data.project?.client?.events && data.project.client.events[0]?.date) ||
    (data.client?.events && data.client.events[0]?.date) ||
    data.client?.weddingDate ||
    data.client?.eventDate ||
    data.agreement?.quotation?.eventDate ||
    '';
  const eventDateStr = rawEventDate ? formatDateStr(rawEventDate) : '';

  const rawTodayDate =
    data.agreement?.assignedAt ||
    data.agreement?.createdAt ||
    data.agreement?.acceptedAt ||
    data.agreement?.signedAt ||
    new Date();
  const todayDateStr = formatDateStr(rawTodayDate);

  const rawTotal =
    data.quotation?.totalAmount ??
    data.quotation?.amount ??
    data.invoice?.totalAmount ??
    data.invoice?.amount ??
    data.project?.financials?.total ??
    data.project?.totalAmount ??
    data.agreement?.quotation?.totalAmount;

  const rawAdvance =
    data.quotation?.advanceAmount ??
    data.quotation?.paidAmount ??
    data.invoice?.paidAmount ??
    data.project?.financials?.paid ??
    data.agreement?.quotation?.advanceAmount;

  const rawBalance =
    data.quotation?.balanceAmount ??
    data.project?.financials?.balance ??
    (rawTotal !== undefined && rawTotal !== null && rawAdvance !== undefined && rawAdvance !== null
      ? Number(rawTotal) - Number(rawAdvance)
      : undefined) ??
    data.agreement?.quotation?.balanceAmount;

  const formattedTotal = rawTotal !== undefined && rawTotal !== null && rawTotal !== '' ? formatCurrency(rawTotal) : '';
  const formattedAdvance = rawAdvance !== undefined && rawAdvance !== null && rawAdvance !== '' ? formatCurrency(rawAdvance) : '';
  const formattedBalance = rawBalance !== undefined && rawBalance !== null && rawBalance !== '' ? formatCurrency(rawBalance) : '';

  let result = text;
  result = result
    .replace(/\{\{\s*CLIENT_NAME\s*\}\}/gi, clientName)
    .replace(/\{\{\s*EVENT_NAME\s*\}\}/gi, eventName)
    .replace(/\{\{\s*EVENT_DATE\s*\}\}/gi, eventDateStr)
    .replace(/\{\{\s*TOTAL_AMOUNT\s*\}\}/gi, formattedTotal)
    .replace(/\{\{\s*ADVANCE_AMOUNT\s*\}\}/gi, formattedAdvance)
    .replace(/\{\{\s*BALANCE_AMOUNT\s*\}\}/gi, formattedBalance)
    .replace(/\{\{\s*TODAY_DATE\s*\}\}/gi, todayDateStr);

  return result;
};
