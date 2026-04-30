import { Component, computed, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonTabs } from '@config/tabs/commonTabsOpen';
import { ListIpProduct } from '@interfaces/ip/products';
import { IpProductsService } from '@services/ip';
import { PermissionService } from '@services/security';
import { moduleActionsId } from '../../../../../environments';
import { TabViewCloseEvent } from 'primeng/tabview';

const IP_PRODUCTS_ACTIONS_ID = moduleActionsId.ip.products;

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent extends CommonTabs<ListIpProduct> implements OnDestroy, OnInit {

  constructor() {
    super('Products');

  }

  //! Inyecciones
  private permissionsSV  = inject(PermissionService);
  private ipProductSV    = inject(IpProductsService);
  //! ----------------------------------------------------------

  //* Señales
  private _ipProductPermissions = signal<IpProductsPermissions>({
    createIpProduct: false,
    updateIpProduct: false,
    enableIpProduct: false,
    disableIpProduct: false,
    viewHistoryIpProduct: false,
    replaceIpProduct: false,
    importIpProduct: false
  });
  ipProductPermissions = computed<IpProductsPermissions>(() => this._ipProductPermissions());
  //* -----------------------------------------------------------

  ngOnInit(): void {
    this._loading.set(true);
    this.loadListPermissionsIpProducts();
    if (!this.isOpenModule) {
      this.loadOpenIpProducts();
    }
  }

  loadOpenIpProducts() {
    this.ipProductSV.loadOpenProducts().subscribe({
      next: resp => {
        if (resp && resp.length > 0) {
          this.openModalConfirmationOpenClose(resp, this.ipProductSV.closeListProducts(resp.map(product => product.id)));
        } else {
          this._loading.set(false)
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyPage();
  }

  closeTab(event: TabViewCloseEvent | {index: number}) {
    this.closeTabAction(event, this.ipProductSV.closeProduct(this.tabs()[event.index - 1].item.id));
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification(event: any): void {
    this.destroyPage();
  }

  private destroyPage() {
    const items = this.tabs().map(item => item.item.id);
    if (items.length > 0) {
      this.dismissNavTab(this.ipProductSV.closeListProducts(items));
    } else {
      this.dismissNavTab(undefined);
    }
  }

  private async loadListPermissionsIpProducts() {
    this._ipProductPermissions.set({
      createIpProduct: await this.permissionsSV.isValidAction(IP_PRODUCTS_ACTIONS_ID.CREATE_IP_PRODUCT),
      updateIpProduct: await this.permissionsSV.isValidAction(IP_PRODUCTS_ACTIONS_ID.UPDATE_IP_PRODUCT),
      enableIpProduct: await this.permissionsSV.isValidAction(IP_PRODUCTS_ACTIONS_ID.ENABLE_IP_PRODUCT),
      disableIpProduct: await this.permissionsSV.isValidAction(IP_PRODUCTS_ACTIONS_ID.DISABLE_IP_PRODUCT),
      viewHistoryIpProduct: await this.permissionsSV.isValidAction(IP_PRODUCTS_ACTIONS_ID.VIEW_HISTORY_IP_PRODUCT),
      replaceIpProduct: await this.permissionsSV.isValidAction(IP_PRODUCTS_ACTIONS_ID.REPLACE_IP_PRODUCT),
      importIpProduct: await this.permissionsSV.isValidAction(IP_PRODUCTS_ACTIONS_ID.IMPORT_IP_PRODUCT)
    });
    if (await this.permissionsSV.isValidAction(IP_PRODUCTS_ACTIONS_ID.IMPORT_IP_PRODUCT)) {
      this._tabs().push({
        item: {
          id: 'import',
          name: 'import',
          description: 'import'
        },
        type:'view',
        pristine: false,
        isImport: true
      });
    }
  }
}

export type IpProductsPermissions = {
  createIpProduct: boolean;
  updateIpProduct: boolean;
  enableIpProduct: boolean;
  disableIpProduct: boolean;
  viewHistoryIpProduct: boolean;
  replaceIpProduct: boolean;
  importIpProduct: boolean;
}
