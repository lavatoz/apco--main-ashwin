import React from 'react';
import { type TemplateProps } from '../types';
import { AahaQuote } from '../quotes/AahaQuote';

export const AahaInvoice: React.FC<TemplateProps> = (props) => {
  return <AahaQuote {...props} />;
};
