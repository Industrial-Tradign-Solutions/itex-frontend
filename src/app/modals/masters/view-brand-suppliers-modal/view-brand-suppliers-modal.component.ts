import { Component, computed, inject, OnInit, Signal, signal } from '@angular/core';
import { Supplier, SupplierBasic } from '@interfaces/partners/suppliers';
import { NavigateTabsService, UtilService } from '@services/util';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { environment } from '../../../../environments/environment';
import { BrandsService } from '@services/masters';
import { Brand } from '@interfaces/masters/brands';
import { finalize } from 'rxjs';
import { Messages } from '@config/messages';
import { SuppliersService } from '@services/partners';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';

const TIMEOUT = environment.timeout;
const MESSAGES = Messages.pages.masters.brands;

@Component({
  selector: 'app-view-brand-suppliers-modal',
  templateUrl: './view-brand-suppliers-modal.component.html',
  styleUrl: './view-brand-suppliers-modal.component.scss'
})
export class ViewBrandSuppliersModalComponent implements OnInit{

  //! Inyecciones
  private utilSV         = inject(UtilService);
  private brandSV        = inject(BrandsService);
  private config         = inject(DynamicDialogConfig);
  private navModule      = inject(NavigateTabsService);
  private supplierSV     = inject(SuppliersService);
  //! ----------------------------------------------------------

  //* Señales
  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());

  private _brand = signal<Brand>(this.config.data.brand);
  brand = computed<Brand>(() => this._brand());

  private _listSupplier = signal<Supplier[]>([]);
  listSuppliers = computed<Supplier[]>(() => this._listSupplier());

  private _brandsPermissions = signal({
    deleteSupplierByBrand: false
  });
  brandsPermissions = computed(() => this._brandsPermissions());

  modalIndustryRef!: Signal<DynamicDialogRef | undefined>;
  //* -----------------------------------------------------------

  supplierId: string | null = null;

  ngOnInit(): void {
    this.supplierSV.loadAllBasic();
    this.loadListSuppliers();
    this.loadBrandsActions();
  }

  private loadListSuppliers() {
    this._loading.set(true);
    setTimeout(() => {
      this.brandSV.listSuppliersByBrandId(this.brand().id)
      .pipe(
        finalize(() => {
          this._loading.set(false);
        })
      )
      .subscribe({
        next: items => {
          this._listSupplier.set(items);
        }
      });
    }, TIMEOUT);
  }

  openSupplier(supplier: Supplier) {
    this.navModule.openModuleNewTabAndOpenItem('Suppliers', supplier.id);
  }

  unAssignSupplierByBrand(supplier: Supplier) {
    if (!this.brandsPermissions().deleteSupplierByBrand) return;
    this.utilSV.confirm({
      message: MESSAGES.unassignSupplier(this.brand().name, supplier.name),
      accept: () => {
        this._loading.set(true);
        setTimeout(() => {
          this.brandSV.unassignSupplierByBrandId(this.brand().id, supplier.id).subscribe({
            next: resp => {
              this.utilSV.setMessage(resp.title, resp.message, 'success');
              this.loadListSuppliers();
            },
            error: err => {
              this.utilSV.setMessage('¡Error!', err, 'error');
              this._loading.set(false);
            }
          });
        }, TIMEOUT);
      }
    });
  }

  get filteredSuppliers(): SupplierBasic[] {
    return this.supplierSV.filteredList;
  }

  searchSupplier(event: AutoCompleteCompleteEvent) {
    this.supplierSV.searchAutoComplete(event);
  }

  addSupplier() {
    this._loading.set(true);
    setTimeout(() => {
      this.brandSV.assignBrandSupplier({
        brandId: this.brand().id,
        supplierId: this.supplierId!
      }).subscribe({
        next: resp => {
          this.utilSV.setMessage(resp.title, resp.message, 'success');
          this.loadListSuppliers();
          this.supplierId = null;
        },
        error: err => {
          this.utilSV.setMessage('¡Error!', err, 'error');
          this._loading.set(false);
        }
      })
    }, TIMEOUT);
  }

  validateUUID(): boolean {
    if (this.supplierId === null) return true;
    return !this.utilSV.validateUUID(this.supplierId);
  }

  private loadBrandsActions() {
    this._brandsPermissions.set({
      deleteSupplierByBrand: this.config.data.permissions.deleteSupplierByBrand
    });
  }
}
