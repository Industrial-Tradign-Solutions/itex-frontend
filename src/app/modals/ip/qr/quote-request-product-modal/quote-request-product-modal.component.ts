import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StaticListsService, UtilService } from '@services/util';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { environment } from '../../../../../environments/environment';
import { Messages, TitlesMessages } from '@config/messages';
import { StaticListItem } from '@interfaces/static-list.model';
import { IpProductsService, IpQuoteRequestService } from '@services/ip';
import { IpQuoteRequestProduct, mapToIpQrProductRequest } from '@interfaces/ip/quoteRequest';
import { finalize, Observable } from 'rxjs';
import { AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { BasicIpProduct } from '@interfaces/ip/products';
import { MessageResponse } from '@interfaces/message-response';

const TIMEOUT = environment.timeout;
const MESSAGES = Messages.pages.partners;
const TITLES = TitlesMessages;

@Component({
  selector: 'app-quote-request-product-modal',
  templateUrl: './quote-request-product-modal.component.html',
  styleUrl: './quote-request-product-modal.component.scss'
})
export class QuoteRequestProductModalComponent implements OnInit {
  //! Inyecciones
  private config      = inject(DynamicDialogConfig);
  private ref         = inject(DynamicDialogRef);
  private formBuilder = inject(FormBuilder);
  private utilSV      = inject(UtilService);
  private staticListSV= inject(StaticListsService);
  private productSV   = inject(IpProductsService);
  private qrSV        = inject(IpQuoteRequestService);
  //! -----------------------------------------------

  //* Señales
  listUnitType = computed<StaticListItem[]>(() => this.staticListSV.getListUnitType());
  listLeadTimeType = computed<StaticListItem[]>(() => this.staticListSV.getListLeadTimeType());
  private _loading = signal<boolean>(true);
  loading = computed<boolean>(() => this._loading());
  type = computed<'create' | 'edit'>(() => this.config.data.type);
  qrId = computed<string>(() => this.config.data.qrId);
  currency = computed<string>(() => this.config.data.currency);
  qrProductId = computed<string>(() => this.config.data.productId);
  //*------------------------------------------------

  formProduct!: FormGroup;

  constructor() {
    this.productSV.loadBasicProducts();
  }

  ngOnInit(): void {
    setTimeout(() => this.initForm(), TIMEOUT);
  }

  onSubmit(): void {
    if (this.formProduct.pristine) {
      this.ref.close({valid: true});
      return;
    }
    this._loading.set(true);
    setTimeout(() => {
      this.submitAction().pipe(
        finalize(() => this._loading.set(false))
      ).subscribe({
        next: (resp) => {
          this.utilSV.setMessage(resp.title, resp.message, 'success')
          this.ref.close({valid: true});
        },
        error: (err) => this.utilSV.setMessage(TITLES.error, err, 'error'),
      })
    }, TIMEOUT);
  }

  private submitAction(): Observable<MessageResponse<IpQuoteRequestProduct>> {
    const data = mapToIpQrProductRequest(this.formProduct.value);
    if (this.type() === 'create') {
      return this.qrSV.createQuoteRequestProduct(this.qrId(), data);
    } else {
      return this.qrSV.updateQuoteRequestProduct(this.qrProductId(), this.qrId(), data);
    }
  }


  closeModal() {
    this.ref.close({valid: false});
  }

  private initForm(): void {
    if (this.type() === 'create') {
      this.buildForm();
      this._loading.set(false);
      return;
    }
    this.qrSV.getQuoteRequestProduct(this.qrProductId(), this.qrId())
    .pipe(
      finalize(() => this._loading.set(false))
    )
    .subscribe({
      next: (resp) => this.buildForm(resp),
      error: (err) => this.utilSV.setMessage(TITLES.error, err, 'error'),
    });
  }

  private buildForm(qrProduct?: IpQuoteRequestProduct): void {
    this.formProduct = this.formBuilder.group({
      productId: [
        qrProduct?.ipProduct?.id ?? null,
        [
          Validators.required
        ]
      ],
      quantity: [
        qrProduct?.quantity ?? null,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],
      unitType: [
        qrProduct?.unitType ?? null,
        [
          Validators.required
        ]
      ],
      leadTime: [
        qrProduct?.leadTime ?? null,
        [
          Validators.min(0)
        ]
      ],
      leadTimeType: [
        qrProduct?.leadTimeType ?? null,
        [
        ]
      ],
      unitPrice: [
        qrProduct?.unitPrice ?? null,
        [
          Validators.min(0)
        ]
      ],
      productRef: [
        qrProduct?.ipProduct?.mfrReference ?? null,
      ],
      productClientDesc: [
        qrProduct?.ipProduct?.clientDescription ?? null,
      ],
      productClientRef: [
        qrProduct?.ipProduct?.clientReference ?? null,
      ],
    });
    if(qrProduct && qrProduct?.ipProduct && qrProduct!.ipProduct!.status !== 'ACTIVE') {
      this.productSV.addDisableItemAction({
        id: qrProduct?.ipProduct.id,
        name: qrProduct?.ipProduct.description,
        description: qrProduct?.ipProduct.description,
        clientDescription: qrProduct?.ipProduct.clientDescription,
        mfrReference: qrProduct?.ipProduct.mfrReference,
        clientReference: qrProduct?.ipProduct.clientReference
      });
    }
    this.formProduct.controls['productRef'].disable();
    this.formProduct.controls['productClientDesc'].disable();
    this.formProduct.controls['productClientRef'].disable();
    this.searchProduct({query: ``, originalEvent: new Event('')});
  }

  searchProduct(event: AutoCompleteCompleteEvent) {
    this.productSV.searchAutoComplete(event);
  }

  get filteredProducts(): BasicIpProduct[] {
    return this.productSV.filteredIpProducts;
  }

  changeProduct(event: AutoCompleteSelectEvent) {
    this.formProduct.patchValue({
      productClientRef: event.value.clientReference,
      productClientDesc: event.value.clientDescription,
      productRef: event.value.mfrReference
    });
  }

  clearProduct(event: any) {
    this.formProduct.patchValue({
      productClientRef: null,
      productClientDesc: null,
      productRef: null
    });
  }
}
