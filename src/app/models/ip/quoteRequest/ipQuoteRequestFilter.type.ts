export type IpQuoteRequestFilter = {
  shortBy?: string;
  shortOrder?: number;

  number?: string;
  clientId?: string;
  supplierId?: string;
  remarks?: string;
  status?: string;
  clientRef?: string;
  supplierRef?: string;
  productDescription?: string;
  salesRepId?: string;
  date: 'DAY' | 'MONTH' | 'YEAR' | 'ALL'
  initDate?: Date;
  endDate?: Date;
}
