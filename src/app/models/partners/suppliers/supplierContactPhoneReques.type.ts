export type SupplierContactPhoneRequest = {
  id?: string;
  type: string;
  countryCode?: number;
  cityCode?: number;
  phoneNumber: number;
  ext?: number;
  validMain: boolean;
}
