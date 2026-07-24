import { inject, Injectable } from '@angular/core';
import { NameModules } from '@config/types/tabs';
import { storageKeys } from '../../../environments';
import { StorageService } from './storage.service';
import { environment } from '../../../environments/environment';

const TABS_STORAGE_MODULE_NAME = storageKeys.tabs.TABS_STORAGE_MODULE_NAME;
const TIMEOUT = environment.timeout;

@Injectable({
  providedIn: 'root'
})
export class NavigateTabsService {

  private storageSV = inject(StorageService);

  constructor() { }

  openModuleNewTabAndOpenItem(module: NameModules, itemId: string) {
    const storageName = `${TABS_STORAGE_MODULE_NAME}-${module}`;
    const isOpenModule = this.storageSV.getPlain<boolean>(storageName);

    if (isOpenModule) {
      this.openTabItem(itemId, module);
    } else {
      window.open(`${environment.web_url}${this.getUrl(module)}`, '_blank');
      setTimeout(() => {
        this.openTabItem(itemId, module);
      }, TIMEOUT / 2);
    }
  }

  private openTabItem(id: string, module: NameModules) {
    localStorage.setItem(`${storageKeys.tabs.TABS_STORAGE_MODULE_ITEM_NAME}-${module}`, id)
  }

  private getUrl(module: NameModules): string {
    if (module === 'Clients')
      return 'partners/clients';
    if (module === 'Suppliers')
      return 'partners/suppliers';
    if (module === 'Products')
      return 'ip/products';
    if (module === 'Quotations')
      return 'ip/q';
    if (module === 'Quote_Requests')
      return 'ip/qr';
    if (module === 'Purchase_Orders')
      return 'ip/po';

    throw Error('Not Exist Modulo')
  }
}
