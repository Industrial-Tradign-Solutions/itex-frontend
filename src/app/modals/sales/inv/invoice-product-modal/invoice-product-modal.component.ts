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
import { finalize, Observable, Subscription } from 'rxjs';
import { environment } from '../../../../../environments/environment';

const TIMEOUT = environment.timeout;
const TITLES  = TitlesMessages;

/**
 * Create/edit of a single invoice product line (§11.1 / §11.2, same body).
 *
 * On edit the line is re-read from §11.3 rather than taken from
 * `item().products`: what the detail embeds is a projection built for the
 * table, it does not necessarily carry every field of the row, and it can be
 * stale by the time the user clicks Edit. The row received through
 * `config.data` is only the initial paint and the source of the line id.
 *
 * `profitMargin` is handled in 0-100 here and sent as-is — the backend stores
 * it verbatim (10.00 = 10%), same convention as Quotations.
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
  isCreate  = computed<boolean>(() => this.type() === 'create');

  private _product = signal<InvoiceProduct | undefined>(this.config.data.product);
  product = computed<InvoiceProduct | undefined>(() => this._product());

  formProduct!: FormGroup;

  // When the parent signals to open the Import from PO modal, close this one
  // with a special response so the parent can chain the next modal.
  private importSub?: Subscription;

  constructor() {
    this.productSV.loadBasicProducts();
  }

  ngOnInit(): void {
    // Subscribe to the parent's signal to open the Import from PO modal.
    const openImportFromPo$ = this.config.data.openImportFromPo$;
    if (openImportFromPo$) {
      this.importSub = openImportFromPo$.subscribe(() => {
        this.ref.close({ valid: false, openImportFromPo: true });
      });
    }

    const product = this.product();

    if (this.isCreate() || !product) {
      setTimeout(() => {
        this.buildForm();
        this._loading.set(false);
      }, TIMEOUT);
      return;
    }

    // The fetch replaces the artificial delay of the create path: the form is
    // built once, from the authoritative copy of the line.
    this.invoiceSV.getInvoiceProduct(this.invoiceId(), product.id)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: resp => {
          this._product.set(resp);
          this.buildForm();
        },
        // Falling back to the row that is already in memory keeps the edit
        // usable; the user is told the values may not be the latest.
        error: err => {
          this.utilSV.setMessage(TITLES.warning, err?.errorMessage ?? err, 'warn');
          this.buildForm();
        }
      });
  }

  // Own state instead of `productSV.filteredIpProducts`: that field lives on a
  // root-provided singleton shared by every open tab and modal.
  filteredProducts: BasicIpProduct[] = [];

  searchProduct(event: AutoCompleteCompleteEvent): void {
    this.filteredProducts = this.productSV.searchAutoComplete(event);
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
    this.importSub?.unsubscribe();
    this.ref.close({ valid: false });
  }

  openImportFromPo(): void {
    this.importSub?.unsubscribe();
    this.ref.close({ valid: false, openImportFromPo: true });
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
      profitMargin: raw.profitMargin,
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
        product ? product.profitMargin : null,
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
