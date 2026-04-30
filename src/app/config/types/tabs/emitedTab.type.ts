import { ItemTab } from "./itemTab.type";
import { TypeTab } from "./typeTab.type";

export type EmitedTab<T extends ItemTab> = {
  item: T;
  type: TypeTab;
  pristine: boolean;
  isImport?: boolean;
}
