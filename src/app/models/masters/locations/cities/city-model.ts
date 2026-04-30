import { State } from "../states";

export interface City {
  id:        string;
  name:      string;
  fullName:  string;
  longitude: number;
  latitude:  number;
  state:     State;
}

