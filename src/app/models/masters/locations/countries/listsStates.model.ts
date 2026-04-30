import { BasicCountry } from "./basicCountry.model";

export interface ListsCountries{
  enables: BasicCountry[],
  disables: BasicCountry[]
}
