import { BasicCountry } from "../countries";

export interface BasicState {
  id:        string;
  name:      string;
  nameShort: string;
  country:   BasicCountry;
}

