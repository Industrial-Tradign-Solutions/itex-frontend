import { Country } from "../countries";

export interface State {
  id:        string;
  name:      string;
  nameShort: string;
  country:   Country;
  longitude: number;
  latitude:  number;
  showShortName: boolean;
}

