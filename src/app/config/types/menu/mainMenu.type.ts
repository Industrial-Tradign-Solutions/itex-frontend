import { MenuItemType } from "./menuItem.type";

export type MainMenuType = {
  id: number;
  name: string;
  url: string;
  icon: string;
  description: string;
  active: boolean;
  items: MenuItemType[];
  createdAt: Date;
}
