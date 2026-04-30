import { computed, inject, signal } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { LayoutService } from "@layout/layout.service";
import { StorageService } from "@services/util";
import { storageKeys } from "../../../environments";
import { Router } from "@angular/router";
import { NameModules } from "@config/types/tabs";
import { Observable, Subscription } from "rxjs";

const TABS_STORAGE_MODULE_NAME = storageKeys.tabs.TABS_STORAGE_MODULE_NAME;

export abstract class BasicPage {
  protected layautSV   = inject(LayoutService);
  protected storageSV = inject(StorageService);

  private route = inject(Router);

  protected isOpenModule: boolean | null = null;

  private _moduleName = signal<NameModules>('');
  moduleName = computed<NameModules>(() => this._moduleName());

  constructor(closeMenu: boolean, name: NameModules) {
    this._moduleName.set(name);

    inject(Title).setTitle(`ITEX - ${this.moduleName().replace('_', ' ')}`);
    this.layautSV.state.staticMenuDesktopInactive = closeMenu;

    const storageName = `${TABS_STORAGE_MODULE_NAME}-${this.moduleName()}`;
    this.isOpenModule = this.storageSV.getPlain<boolean>(storageName);

    if (this.isOpenModule) {
      this.route.navigateByUrl('/p/not-found');
      window.close();
    } else {
      this.storageSV.set(storageName, true);
    }
  }

  protected destroyTab(options?: {storageSubscription?: Subscription, onCloseItems?: Observable<any>}) {
    if (!this.isOpenModule) {
      this.storageSV.delete(`${TABS_STORAGE_MODULE_NAME}-${this.moduleName()}`);
      if (options && options.storageSubscription) {
        options.storageSubscription.unsubscribe();
      }
      if (options && options.onCloseItems) {
        options.onCloseItems.subscribe();
      }
    }
  }
}
