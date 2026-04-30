import { Component, computed, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { Messages, TitlesMessages } from '@config/messages';
import { CommonPageTab } from '@config/tabs/commonPageTab';
import { IpProduct, IpProductAddSurplusRequest, IpProductOutSurplusRequest, IpProductsRequest, ListIpProduct, mapToIpProductsRequest } from '@interfaces/ip/products';
import { IpProductsPermissions } from '@pages/principal/ip/products/products.component';
import { IpProductsService } from '@services/ip';
import { BrandsService } from '../../../../services/masters/brands.service';
import { CountriesService } from '@services/masters';
import { Validators } from '@angular/forms';
import { StaticListItem } from '@interfaces/static-list.model';
import { DropdownChangeEvent } from 'primeng/dropdown';
import { BasicBrand } from '@interfaces/masters/brands';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { BasicCountry } from '@interfaces/masters/locations/countries';
import { finalize, Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { SubstituteIpProductModalComponent } from '@modals/ip/products/substitute-ip-product-modal/substitute-ip-product-modal.component';
import { MessageResponse } from '@interfaces/message-response';
import { EmitedTab } from '@config/types/tabs';
import { HistoryIpProductModalComponent } from '@modals/ip/products/history-ip-product-modal/history-ip-product-modal.component';
import { AddSurplusIpProductModalComponent } from '@modals/ip/products/add-surplus-ip-product-modal/add-surplus-ip-product-modal.component';
import { OutSurplusIpProductModalComponent } from '@modals/ip/products/out-surplus-ip-product-modal/out-surplus-ip-product-modal.component';

const MESSAGES = Messages.pages.ip.products;
const TITLES = TitlesMessages;
const TIMEOUT = environment.timeout;

@Component({
  selector: 'app-form-ip-products',
  templateUrl: './form-ip-products.component.html',
  styleUrl: './form-ip-products.component.scss'
})
export class FormIpProductsComponent extends CommonPageTab<ListIpProduct, IpProductsPermissions, IpProduct> implements OnInit {
  @Output() opened = new EventEmitter<EmitedTab<ListIpProduct>>();

  //! Inyecciones
  private productSV      = inject(IpProductsService);
  private brandsSV       = inject(BrandsService);
  private countrySV      = inject(CountriesService);
  //! _________________________________________________________________
  //* Señales
  listIpProductStatus = computed<StaticListItem[]>(() => this.staticListSV.getListIpProductsStatus());
  listIpProductFreightClass = computed<StaticListItem[]>(() => this.staticListSV.getListFreightClass());
  //* -----------------------------------------------------------
  //? Variables

  //?------------------------------------------------------------

  constructor() {
    super(MESSAGES);
    this.brandsSV.loadBrands(false);
    this.countrySV.loadCountries();
  }

  ngOnInit(): void {
    this.onInitAction({
      updatePermission: this.permissions().updateIpProduct,
      openAndLock: this.productSV.openAndLockProduct(this.tabItem.item.id, this.tabItem.type),
      module: 'products'
    });
  }

  changeStatus(event: DropdownChangeEvent) {
    const productId = this.tabItem.item.id;
    const productName = this.tabItem.item.name;

    const actions: Record<string, () => void> = {
      ACTIVE: () => this.handlePermissionedAction(
        this.permissions().enableIpProduct,
        MESSAGES.confirmEnable(productName),
        () => this.productSV.enableProduct(productId),
        'ACTIVE',
        MESSAGES.enableNotAllowed
      ),
      INACTIVE: () => this.handlePermissionedAction(
        this.permissions().disableIpProduct,
        MESSAGES.confirmDisable(productName),
        () => this.productSV.disableProduct(productId),
        'INACTIVE',
        MESSAGES.disableNotAllowed
      ),
      SUBSTITUTED: () => this.handleSubstitution(
        this.permissions().replaceIpProduct,
        productId,
        MESSAGES.replaceNotAllowed
      )
    };
    actions[event.value]?.();
  }

  private handlePermissionedAction(
    hasPermission: boolean,
    message: string,
    action: () => Observable<MessageResponse<ListIpProduct>>,
    newStatus: 'ACTIVE' | 'INACTIVE',
    errorMessage: string
  ) {
    if (!hasPermission) {
      return this.rejectStatusChange(errorMessage);
    }

    this.utilSV.confirm({
      message,
      header: TITLES.confirmation,
      accept: () => this.executeChangeStatus(action(), newStatus),
      reject: () => this.resetFormStatus()
    });
  }

  openProduct(product: IpProduct) {
    this.opened.emit({
      type: this.permissions().updateIpProduct ? 'edit' : 'view',
      item: product.substituteProduct,
      pristine: true
    });
  }

  openHisotyr(product: IpProduct) {
    this.dialogSV.open(HistoryIpProductModalComponent, {
      header: `HISTORY OF ${product.name}`,
      width: '70rem',
      closable: true,
      closeOnEscape: true,
      data: {
        productId: product.id
      }
    }).onClose.subscribe();
  }

  openModalAddSurplus(product: IpProduct) {
    this.dialogSV.open(AddSurplusIpProductModalComponent, {
      header: `ADD SURPLUS - ${product.name}`,
      width: '40rem',
      closable: false,
      closeOnEscape: false,
      data: {
        productId: product.id
      }
    }).onClose.subscribe((resp: IpProductAddSurplusRequest) => {
      if(resp) {
        this.executeAddOutSurplus(this.productSV.addSurplusProduct(this.item()!.id, resp));
      }
    });
  }

  openModalOutSurplus(product: IpProduct) {
    this.dialogSV.open(OutSurplusIpProductModalComponent, {
      header: `OUT SURPLUS - ${product.name}`,
      width: '40rem',
      closable: false,
      closeOnEscape: false,
      data: {
        productId: product.id
      }
    }).onClose.subscribe((resp: IpProductOutSurplusRequest) => {
      if(resp) {
        this.executeAddOutSurplus(this.productSV.outSurplusProduct(this.item()!.id, resp));
      }
    });
  }

  createQR(product: IpProduct) {
    this.utilSV.setMessage(
      TITLES.error,
      'Create QR is not implemented',
      'warn'
    );
  }

  private handleSubstitution(
    hasPermission: boolean,
    productId: string,
    errorMessage: string
  ) {
    if (!hasPermission) {
      return this.rejectStatusChange(errorMessage);
    }

    const modal = this.dialogSV.open(SubstituteIpProductModalComponent, {
      header: 'Substitute Product',
      width: '40rem',
      closable: true,
      closeOnEscape: true
    });

    modal.onClose.subscribe({
      next: (resp) => {
        if (resp) {
          this.executeChangeStatus(
            this.productSV.substituteProduct({ productId, newProductId: resp.id }),
            'SUBSTITUTED'
          );
        } else {
          this.resetFormStatus();
        }
      }
    });
  }

  private rejectStatusChange(errorMessage: string) {
    this.resetFormStatus();
    this.utilSV.setMessage(TITLES.error, errorMessage, 'error');
  }

  private resetFormStatus() {
    this.formTab.patchValue({ status: this.item()?.status ?? 'ACTIVE' });
  }

  private executeChangeStatus(action: Observable<MessageResponse<IpProduct | ListIpProduct | any>>, newStatus: 'ACTIVE' | 'INACTIVE' | 'SUBSTITUTED') {
    this._loading.set(true);
    this.showForm = false;
    action
      .pipe(finalize(() => {
        setTimeout(() => {
          this._loading.set(false);
          this.enableForm();
        }, TIMEOUT);
      }))
      .subscribe({
      next: (resp) => {
        this.utilSV.setMessage(resp.title, resp.message, 'success');
        this._item()!.status = newStatus;
        this.tabItem.item.status = newStatus;
        if (newStatus === 'SUBSTITUTED') {
          this.tabItem.type = 'view';
          this.tabItem.pristine = true;
          this._item()!.substituteProduct = resp.data.substituteProduct;
          this.enableForm();
        }
      },
      error: (err) => {
        this.rejectStatusChange(err);
      }
    });
  }

  private executeAddOutSurplus(action: Observable<MessageResponse<IpProduct>>) {
    this._loading.set(true);
    this.showForm = false;
    action
      .pipe(finalize(() => {
        setTimeout(() => {
          this._loading.set(false);
          this.enableForm();
        }, TIMEOUT);
      }))
      .subscribe({
      next: (resp) => {
        this.utilSV.setMessage(resp.title, resp.message, 'success');
        this._item()!.surplus = resp.data.surplus;
        this._item()!.surplusLocation = resp.data.surplusLocation;
        this._item()!.totalSurplus = resp.data.totalSurplus;
        this.formTab.patchValue({ location: resp.data?.surplusLocation?.location ?? ' ' });
        this.formTab.patchValue({ price: resp.data?.surplusLocation?.price ?? ' ' });
        this.formTab.patchValue({ totalSurplus: resp.data?.totalSurplus ?? ' ' });
        this.formTab.patchValue({ whNumber: resp.data?.surplusLocation?.whNumber ?? ' ' });
      },
      error: (err) => {
        this.utilSV.setMessage(TITLES.error, err, 'error');
      }
    });
  }

  protected override getRequest(): IpProductsRequest {
    return mapToIpProductsRequest(this.formTab.value);
  }

  protected override buildFormAction(): void {
    if (this.tabItem.type === 'edit') {
      if (this.item()?.brand && this.item()?.brand.id && this.item()?.brand.active === false) {
        this.brandsSV.addDisableItemAction({
          id: this.item()!.brand.id,
          name: `${this.item()!.brand.name} (DISABLED)`,
          active: this.item()!.brand.active
        });
      }
    }

    this.formTab = this.formBuilder.group({
      brandId: [
        this.item()?.brand?.id ?? null,
        []
      ],
      description: [
        this.item()?.description ?? null,
        [
          Validators.required
        ]
      ],
      clientDescription: [
        this.item()?.clientDescription ?? null,
        [
        ]
      ],
      mfrReference: [
        this.item()?.mfrReference ?? null,
        [
        ]
      ],
      clientReference: [
        this.item()?.clientReference ?? null,
        [
        ]
      ],
      netWeightLbs: [
        this.item()?.netWeightLbs ?? null,
        [
          Validators.min(0),
          Validators.max(999999999999)
        ]
      ],
      nmfc: [
        this.item()?.nmfc ?? null,
        [
          Validators.min(0),
          Validators.max(2147483647)
        ]
      ],
      freightClass: [
        this.item()?.freightClass ?? null,
        [
        ]
      ],
      notes: [
        this.item()?.notes ?? null,
        []
      ],
      keywords: [
        this.item()?.keywords ?? null,
        []
      ],
      htsScheduleBNumber: [
        this.item()?.htsScheduleBNumber ?? null,
        [
          Validators.min(0),
          Validators.max(2147483647)
        ]
      ],
      eccn: [
        this.item()?.eccn ?? null,
        [
        ]
      ],
      cooId: [
        this.item()?.coo?.id ?? null,
        [
        ]
      ],
      battery: [
        this.item()?.battery ?? false,
        [
          Validators.required
        ]
      ],
      hazmat: [
        this.item()?.hazmat ?? false,
        [
          Validators.required
        ]
      ],
      dualUse: [
        this.item()?.dualUse ?? false,
        [
          Validators.required
        ]
      ],
      status: [
        this.item()?.status ?? 'ACTIVE',
        [
          Validators.required
        ]
      ],
      location: [
        this.item()?.surplusLocation?.location ?? ' ',
        [
          Validators.required
        ]
      ],
      price: [
        this.item()?.surplusLocation?.price ?? ' ',
        [
          Validators.required
        ]
      ],
      totalSurplus: [
        this.item()?.totalSurplus ?? ' ',
        [
          Validators.required
        ]
      ],
      whNumber: [
       this.item()?.surplusLocation?.whNumber ?? ' ',
        [
          Validators.required
        ]
      ],
    });
  }
  protected override enableForm(): void {
    if (this.item()?.status === 'SUBSTITUTED' || this.tabItem.type === 'view') {
      this.formTab.disable();
    } else {
      this.formTab.enable();
      this.formTab.controls['status'].disable();

      if (this.tabItem.type === 'edit') {
        if (this.permissions().updateIpProduct || this.permissions().enableIpProduct || this.permissions().replaceIpProduct) {
          this.formTab.controls['status'].enable();
        }
      }
    }

    this.formTab.controls['totalSurplus'].disable();
    this.formTab.controls['location'].disable();
    this.formTab.controls['whNumber'].disable();
    this.formTab.controls['price'].disable();

    this.showForm = true;
    this.searchBrand({query: ``, originalEvent: new Event('')})
    this.searchCoo({query: ``, originalEvent: new Event('')})
  }

  override onSubmit(): void {
    if(this.tabItem.pristine) return;
    if(this.tabItem.type === 'view') return;
    this.onSubmitAction({
      updatePermission: this.permissions().updateIpProduct,
      action: this.getSubmitAction()
    });
  }

  private getSubmitAction(): Observable<MessageResponse<IpProduct>> {
    let data: IpProductsRequest = this.getRequest();
    if (this.tabItem.type === 'create') {
      return this.productSV.createProduct(data);
    } else if (this.tabItem.type === 'edit') {
      return this.productSV.updateProduct(this.tabItem.item.id, data);
    } else {
      throw Error;
    }
  }

  get filteredBrands(): BasicBrand[] {
    return this.brandsSV.filteredBrands;
  }

  searchBrand(event: AutoCompleteCompleteEvent) {
    this.brandsSV.searchAutoComplete(event);
  }

  get filteredCoo(): BasicCountry[] {
    return this.countrySV.filteredCountries;
  }

  searchCoo(event: AutoCompleteCompleteEvent) {
    this.countrySV.searchAutoComplete(event);
  }
}
