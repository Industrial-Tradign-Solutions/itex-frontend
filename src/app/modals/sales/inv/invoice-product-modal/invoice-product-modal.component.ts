import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TitlesMessages } from '@config/messages';
import { BasicIpProduct } from '@interfaces/ip/products';
import { MessageResponse } from '@interfaces/message-response';
import { InvoiceProduct, InvoiceProductRequest } from '@interfaces/sales/invoice';
import { StaticListItem } from '@interfaces/static-list.model';
import { IpProductsService } from '@services/ip';
import { InvoiceService } from '@services/sales';
import { StaticListsService, UtilService } from '@services/util';
import { AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { finalize, Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

const TIMEOUT = environment.timeout;
const TITLES  = TitlesMessages;

/**
 * Create/edit of a single invoice product line (§11.1 / §11.2, same body).
 *
 * The line comes in through `config.data` instead of being re-fetched with
 * §11.3: the parent already holds it inside `item().products`.
 *
 * `profitMargin` is handled in 0-100 here and divided by 100 on submit — the
 * backend stores it as a fraction (0.30 = 30%), same convention as Quotations.
 */
@Component({
  selector: 'app-invoice-product-modal',
  templateUrl: './invoice-product-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceProductModalComponent implements OnInit {

  private config       = inject(DynamicDialogConfig);
  private ref          = inject(DynamicDialogRef);
  private formBuilder  = inject(FormBuilder);
  private utilSV       = inject(UtilService);
  private staticListSV = inject(StaticListsService);
  private productSV    = inject(IpProductsService);
  private invoiceSV    = inject(InvoiceService);

  listUnitType     = computed<StaticListItem[]>(() => this.staticListSV.getListUnitType());
  listLeadTimeType = computed<StaticListItem[]>(() => this.staticListSV.getListLeadTimeType());
  listCondition    = computed<StaticListItem[]>(() => this.staticListSV.getListIpQuotationProductCondition());

  private _loading = signal<boolean>(true);
  loading = computed<boolean>(() => this._loading());

  type      = computed<'create' | 'edit'>(() => this.config.data.type);
  invoiceId = computed<string>(() => this.config.data.invoiceId);
  currency  = computed<string>(() => this.config.data.currency ?? 'USD');
  product   = computed<InvoiceProduct | undefined>(() => this.config.data.product);
  isCreate  = computed<boolean>(() => this.type() === 'create');

  formProduct!: FormGroup;

  constructor() {
    this.productSV.loadBasicProducts();
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.buildForm();
      this._loading.set(false);
    }, TIMEOUT);
  }

  get filteredProducts(): BasicIpProduct[] {
    return this.productSV.filteredIpProducts;
  }

  searchProduct(event: AutoCompleteCompleteEvent): void {
    this.productSV.searchAutoComplete(event);
  }

  changeProduct(event: AutoCompleteSelectEvent): void {
    const product = event.value as BasicIpProduct;
    this.formProduct.patchValue({
      productRef: product.mfrReference,
      productClientDesc: product.clientDescription,
      productClientRef: product.clientReference
    });
  }

  clearProduct(): void {
    this.formProduct.patchValue({
      productRef: null,
      productClientDesc: null,
      productClientRef: null
    });
  }

  onSubmit(): void {
    if (this.formProduct.invalid) return;
    if (this.formProduct.pristine) {
      this.ref.close({ valid: false });
      return;
    }

    this._loading.set(true);
    setTimeout(() => {
      this.submitAction().pipe(
        finalize(() => this._loading.set(false))
      ).subscribe({
        next: resp => {
          this.utilSV.setMessage(resp.title, resp.message, 'success');
          this.ref.close({ valid: true });
        },
        // `sales.invoice.product.exist` lands here: the modal stays open so the
        // user can pick another product instead of losing what was typed.
        error: err => this.utilSV.setMessage(TITLES.error, err?.errorMessage ?? err, 'error')
      });
    }, TIMEOUT);
  }

  closeModal(): void {
    this.ref.close({ valid: false });
  }

  private submitAction(): Observable<MessageResponse<InvoiceProduct>> {
    const request = this.getRequest();
    return this.isCreate()
      ? this.invoiceSV.createInvoiceProduct(this.invoiceId(), request)
      : this.invoiceSV.updateInvoiceProduct(this.invoiceId(), this.product()!.id, request);
  }

  private getRequest(): InvoiceProductRequest {
    const raw = this.formProduct.getRawValue();
    return {
      productId: raw.productId,
      quantity: raw.quantity,
      unitType: raw.unitType,
      leadTime: raw.leadTime ?? 0,
      leadTimeType: raw.leadTimeType,
      unitPrice: raw.unitPrice,
      profitMargin: raw.profitMargin / 100,
      condition: raw.condition
    };
  }

  private buildForm(): void {
    const product = this.product();
    const ipProduct = product?.ipProduct;

    this.formProduct = this.formBuilder.group({
      productId: [ipProduct?.id ?? null, [Validators.required]],
      productDescription: [ipProduct?.description ?? null],
      productRef: [ipProduct?.mfrReference ?? null],
      productClientDesc: [ipProduct?.clientDescription ?? null],
      productClientRef: [ipProduct?.clientReference ?? null],

      quantity: [product?.quantity ?? null, [Validators.required, Validators.min(0)]],
      unitType: [product?.unitType ?? null, [Validators.required]],
      unitPrice: [product?.unitPrice ?? null, [Validators.required, Validators.min(0)]],
      leadTime: [product?.leadTime ?? 0, [Validators.min(0)]],
      leadTimeType: [product?.leadTimeType ?? null],

      profitMargin: [
        product ? product.profitMargin * 100 : null,
        [Validators.required, Validators.min(0.01), Validators.max(100)]
      ],
      condition: [product?.condition ?? 'NEW', [Validators.required]]
    });

    // Read-only mirrors of the catalog record; they never travel in the request.
    ['productDescription', 'productRef', 'productClientDesc', 'productClientRef']
      .forEach(field => this.formProduct.controls[field].disable());

    // Swapping the product of an existing line would collide with
    // `sales.invoice.product.exist` — remove and add instead.
    if (!this.isCreate()) {
      this.formProduct.controls['productId'].disable();
    }

    this.searchProduct({ query: '', originalEvent: new Event('') });
  }

}
