export type ClientContactPhoneRequest = {
  id?: string;
  countryCode: number;
  cityCode: number;
  phoneNumber: number;
  ext?: number;
  validMain: boolean;
}
