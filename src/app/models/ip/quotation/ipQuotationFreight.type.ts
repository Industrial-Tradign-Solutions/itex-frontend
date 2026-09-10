export type FreightChargesFormValue = {
  profitMarginFreightCharges: number;
  freightChargeMiamiITS: number;
};

export type FreightChargesModalData = {
  currency: string;
  freightCharges: number;
} & FreightChargesFormValue;

export type FreightChargesModalResult = {
  valid: boolean;
  freightCharges?: FreightChargesFormValue;
};

/**
 * Normaliza los datos que recibe el modal de fletes desde `DynamicDialogConfig`.
 * Centraliza los defaults (0) para que el formulario nunca arranque en `null`.
 */
export function normalizeFreightChargesModalData(
  raw: Partial<FreightChargesModalData> | undefined
): FreightChargesModalData {
  return {
    currency: raw?.currency ?? 'USD',
    freightCharges: raw?.freightCharges ?? 0,
    profitMarginFreightCharges: raw?.profitMarginFreightCharges ?? 0,
    freightChargeMiamiITS: raw?.freightChargeMiamiITS ?? 0
  };
}
