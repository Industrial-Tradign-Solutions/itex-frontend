import { InvoiceFilterDate, InvoiceStatus } from "./invoiceEnums.type";

// Query params of `GET /sales/invoice`. `shortOrder`: 0 = DESC, 1 = ASC.
export type InvoiceFilter = {
  number?: string;
  draftNumber?: string;
  clientId?: string;
  remarks?: string;
  status?: InvoiceStatus;
  salesRepId?: string;
  overdue?: boolean;
  initDueAt?: Date;
  endDueAt?: Date;
  date?: InvoiceFilterDate;
  initDate?: Date;
  endDate?: Date;
  shortBy?: string;
  shortOrder?: number;
}
