import { MenuItemType } from "./menuItem.type";

export type ActionType = {
  id: number;
  name: string;
  description: string;
  menu: MenuItemType | null;
  active: boolean;
  createdAt: Date;
}
