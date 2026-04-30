import { Component, computed, HostListener, inject, OnDestroy, OnInit, Signal, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { BasicPage } from '@config/page/basicPage';
import { Brand, BrandFilter } from '@interfaces/masters/brands';
import { Page } from '@interfaces/page.model';
import { BrandsService } from '@services/masters';
import { PermissionService } from '@services/security';
import { UtilService } from '@services/util';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { moduleActionsId } from '../../../../../environments';
import { finalize, Observable } from 'rxjs';
import { Paginator } from 'primeng/paginator';
import { Table } from 'primeng/table';
import { environment } from '../../../../../environments/environment';
import { SortEvent } from 'primeng/api';
import { Messages } from '@config/messages';
import { MessageResponse } from '@interfaces/message-response';
import { BrandModalComponent } from '@modals/masters/brand-modal/brand-modal.component';
import { ImportExcelBrandModalComponent } from '@modals/masters/import-excel-brand-modal/import-excel-brand-modal.component';
import { ViewBrandSuppliersModalComponent } from '@modals/masters/view-brand-suppliers-modal/view-brand-suppliers-modal.component';

const BRANDS_ACTIONS_ID = moduleActionsId.masters.brands;
const TIMEOUT = environment.timeout;
const MESSAGES = Messages.pages.masters.brands;

@Component({
  selector: 'app-brands',
  templateUrl: './brands.component.html',
  styles: ''
})
export class BrandsComponent extends BasicPage implements OnInit, OnDestroy {

  @ViewChild('paginator') paginator!: Paginator;
  @ViewChild('dt1') dt!: Table;

  constructor() {
    super(true, 'Brands');
    this.formBuild();
  }

  //! Inyecciones
  private permissionsSV  = inject(PermissionService);
  private brandsSV       = inject(BrandsService);
  private utilSV         = inject(UtilService);
  private dialogSV       = inject(DialogService);
  private formBuilder    = inject(FormBuilder);
  //! ----------------------------------------------------------
  //* Señales
  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());

  private _page = signal<Page<Brand>>({
    content: [],
    page: {
      number: 0,
      size: 10,
      totalElements: 0,
      totalPages: 0
    }
  });
  page = computed<Page<Brand>>(() => this._page());

  private _brandsPermissions = signal({
    createBrand: false,
    enableBrand: false,
    disableBrand: false,
    importExcelBrand: false,
    deleteSupplierByBrand: false
  });
  brandsPermissions = computed(() => this._brandsPermissions());

  modalBrandRef!: Signal<DynamicDialogRef | undefined>;
  //* -----------------------------------------------------------

  //? Variables
  formFilter!: FormGroup;
  disableShort: boolean = false;
  //?------------------------------------------------------------

  ngOnInit(): void {
    this.loadBrandsActions();
    this.search(true);
  }

  ngOnDestroy(): void {
    this.destroyTab();
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification(event: any): void {
    this.destroyTab();
  }

  search(resetPaginator: boolean, page: number = 0, size: number = 10) {
    if(resetPaginator && this.page().content.length > 0 && this.page().page.totalPages > 1) {
      this.paginator.changePage(0);
    }
    const filters: BrandFilter = this.formFilter?.value;
    this.disableShort = true;
    this.searchAction(this.brandsSV.listAllBrandPage(filters, page, size));
  }

  private searchAction(obs: Observable<Page<Brand>>) {
    this.viewLoading();
    obs.pipe(
      finalize(() => this.closeLoading())
    ).subscribe({
      next: resp => {
        this._page.set(resp);
      },
      error: err => {
        this.utilSV.setMessage('¡Error!', err, 'error');
      }
    });
  }

  viewListSuppliers(brand: Brand) {
    this.modalBrandRef =  computed(() => this.dialogSV.open(ViewBrandSuppliersModalComponent,{
      header: `LIST SUPPLIERS - ${brand.name}` ,
      width: '40rem',
      closeOnEscape: false,
      data: {
        brand,
        permissions: this.brandsPermissions()
      }
    }));
    this.modalBrandRef()?.onClose.subscribe(() => {
      this.modalBrandRef = computed(() => undefined);
    });
  }

  customSort(event: SortEvent) {
    if (!this.disableShort && this.page().content.length > 0) {
      this.formFilter.controls['shortBy'].setValue(event.field);
      this.formFilter.controls['shortOrder'].setValue(event.order);
      this.search(true);
    }
  }

  openModalBrand() {
    this.modalBrandRef =  computed(() => this.dialogSV.open(BrandModalComponent,{
      header: `CREATE BRAND` ,
      width: '45rem',
      closable: false,
      closeOnEscape: false
    }));
    this.modalBrandRef()?.onClose.subscribe((resp: {brandResponse: MessageResponse<Brand>}) => {
      if (resp && resp.brandResponse) {
        this.utilSV.setMessage(resp.brandResponse.title, resp.brandResponse.message, 'success');
        this.search(true);
      }
      this.modalBrandRef = computed(() => undefined);
    });
  }

  openModalImportBrand() {
    this.modalBrandRef =  computed(() => this.dialogSV.open(ImportExcelBrandModalComponent,{
      header: `IMPORT EXCEL BRAND` ,
      width: '35rem',
      closable: false,
      closeOnEscape: false
    }));
    this.modalBrandRef()?.onClose.subscribe((resp: {importBrandResponse: MessageResponse<Brand[]>}) => {
      if (resp && resp.importBrandResponse) {
        this.utilSV.setMessage(resp.importBrandResponse.title, resp.importBrandResponse.message, 'success');
        this.search(true);
      }
      this.modalBrandRef = computed(() => undefined);
    });
  }

  disableBrand(brand: Brand) {
    if (!this.brandsPermissions().disableBrand) return;
    this.utilSV.confirm({
      message: MESSAGES.disable(brand.name),
      accept: () => {
        this.serviceAction(this.brandsSV.disable(brand.id));
      }
    });
  }

  enableBrand(brand: Brand) {
    if (!this.brandsPermissions().enableBrand) return;
    this.utilSV.confirm({
      message: MESSAGES.enable(brand.name),
      accept: () => {
        this.serviceAction(this.brandsSV.enable(brand.id));
      }
    });
  }

  private serviceAction(observable: Observable<MessageResponse<string>>) {
    this._loading.set(true);
    setTimeout(() => {
      observable.subscribe({
        next: resp => {
          this.utilSV.setMessage(resp.title, resp.message, 'success');
          this.search(true);
        },
        error: err => {
          this.utilSV.setMessage('¡Error!', err, 'error');
          this._loading.set(false);
        }
      });
    }, TIMEOUT);
  }

  changePage(event: any) {
    this.search(false, event.page, event.rows);
  }

  resetForm(dt: Table) {
    this.formFilter.reset();
    dt.reset();
  }

  private viewLoading() {
    this._loading.set(true);
    this.formFilter?.disable();
  }

  private closeLoading() {
    setTimeout(() => {
      this.formFilter?.enable();
      this._loading.set(false);
      setTimeout(() => {
        this.disableShort = false;
      }, 100);
    }, TIMEOUT );
  }

  private async loadBrandsActions() {
    this._brandsPermissions.set({
      createBrand: await this.permissionsSV.isValidAction(BRANDS_ACTIONS_ID.CREATE_BRAND),
      enableBrand: await this.permissionsSV.isValidAction(BRANDS_ACTIONS_ID.ENABLE_BRAND),
      disableBrand: await this.permissionsSV.isValidAction(BRANDS_ACTIONS_ID.DISABLE_BRAND),
      importExcelBrand: await this.permissionsSV.isValidAction(BRANDS_ACTIONS_ID.IMPORT_EXCEL_BRAND),
      deleteSupplierByBrand: await this.permissionsSV.isValidAction(BRANDS_ACTIONS_ID.DELETE_SUPPLIER_BRAND)
    });
  }

  private formBuild(): any {
    this.formFilter = this.formBuilder.group({
      name: [
        null,
        []
      ],
      shortBy: [
        'name',
        []
      ],
      shortOrder: [
        1,
        []
      ]
    });
  }
}
