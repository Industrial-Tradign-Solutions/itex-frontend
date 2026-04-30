import { BasicIndustry } from "@interfaces/masters/industries";

export type ListClients = {
  id        : string;
  code      ?: string;
  name      : string;
  taxId     ?: string;
  city      ?: string;
  address   ?: string;
  industry  ?: BasicIndustry;
  status    ?: string;
}
