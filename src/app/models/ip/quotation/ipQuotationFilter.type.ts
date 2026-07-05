export type IpQuotationFilter = {
  shortBy?: string;
  shortOrder?: number;
  number?: string;
  clientId?: string;
  remarks?: string;
  status?: string;
  salesRepId?: string;
  date: 'DAY' | 'MONTH' | 'YEAR' | 'ALL'
  initDate?: Date;
  endDate?: Date;
}
