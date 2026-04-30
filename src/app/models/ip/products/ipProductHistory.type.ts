export type IpProductsHistory = {
  employee: string;
  createdAt: Date;
  data: any;
  action: 'CREATE' | 'UPDATE' | 'DISABLE' | 'ENABLE' | 'REPLACE' | 'ADD_SURPLUS' | 'REMOVE_SURPLUS';
}
