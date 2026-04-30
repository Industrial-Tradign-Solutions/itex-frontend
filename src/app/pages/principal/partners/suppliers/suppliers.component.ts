import { Component, computed, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonTabs } from '@config/tabs/commonTabsOpen';
import { ListSuppliers } from '@interfaces/partners/suppliers';
import { SuppliersService } from '@services/partners';
import { PermissionService } from '@services/security';
import { TabViewCloseEvent } from 'primeng/tabview';
import { moduleActionsId } from '../../../../../environments';

const SUPPLIERS_ACTIONS_ID = moduleActionsId.partners.suppliers;

@Component({
  selector: 'app-suppliers',
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.scss'
})
export class SuppliersComponent extends CommonTabs<ListSuppliers> implements OnInit, OnDestroy {
  constructor() {
    super('Suppliers')
  }

  //! Inyecciones
  private permissionsSV  = inject(PermissionService);
  private suppliersSV    = inject(SuppliersService);
  //! ----------------------------------------------------------

  //* Señales
  private _supplierPermissions = signal<SupplierPermissions>({
    updateSupplier: false,
    createSupplier: false,
    changeStatusSupplier: false
  });
  supplierPermissions = computed<SupplierPermissions>(() => this._supplierPermissions());
  //* -----------------------------------------------------------

  ngOnInit(): void {
    this._loading.set(true);
    this.loadListPermissionsSuppliers();
    if (!this.isOpenModule) {
      this.loadOpenSuppliers();
    }
  }

  loadOpenSuppliers() {
    this.suppliersSV.loadOpenSuppliers().subscribe({
      next: resp => {
        if (resp && resp.length > 0) {
          this.openModalConfirmationOpenClose(resp, this.suppliersSV.closeListSuppliers(resp.map(prospect => prospect.id)));
        } else {
          this._loading.set(false)
        }
      }
    });
  }

  closeTab(event: TabViewCloseEvent | {index: number}) {
    this.closeTabAction(event, this.suppliersSV.closeSupplier(this.tabs()[event.index - 1].item.id));
  }

  private async loadListPermissionsSuppliers() {
    this._supplierPermissions.set({
      createSupplier: await this.permissionsSV.isValidAction(SUPPLIERS_ACTIONS_ID.CREATE_SUPPLIER),
      updateSupplier: await this.permissionsSV.isValidAction(SUPPLIERS_ACTIONS_ID.UPDATE_SUPPLIER),
      changeStatusSupplier: await this.permissionsSV.isValidAction(SUPPLIERS_ACTIONS_ID.CHANGE_STATUS_SUPPLIER),
    });
  }

  ngOnDestroy(): void {
    this.destroyPage();
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification(event: any): void {
    this.destroyPage();
  }

  private destroyPage() {
    const items = this.tabs().map(item => item.item.id);
    if (items.length > 0) {
      this.dismissNavTab(this.suppliersSV.closeListSuppliers(items));
    } else {
      this.dismissNavTab(undefined);
    }
  }
}

export type SupplierPermissions = {
  updateSupplier: boolean;
  createSupplier: boolean;
  changeStatusSupplier: boolean;
}
