import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TitlesMessages } from '@config/messages';
import { MessageResponse } from '@interfaces/message-response';
import { InvoiceTax, InvoiceTaxRequest } from '@interfaces/sales/invoice';
import { StaticListItem } from '@interfaces/static-list.model';
import { InvoiceService } from '@services/sales';
import { StaticListsService, UtilService } from '@services/util';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { finalize, Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

const TIMEOUT = environment.timeout;
const TITLES  = TitlesMessages;

/**
 * Create/edit of a tax line (§13).
 *
 * Taxes are entered by hand, but only `type`, `description`, `rate` and
 * `taxableBase` travel: §17 removed `value` from the request and the backend
 * computes it as `taxableBase * rate` with BigDecimal (scale 5, HALF_UP). The
 * Value input is therefore a disabled preview of what the server will persist,
 * not an editable field. `taxableBase` is pre-filled with the products subtotal
 * as a convenience.
 *
 * `rate` is typed as a percentage and divided by 100 on submit (the API stores
 * 0.0875 for 8.75%).
 *
 * On edit the tax is re-read from `GET .../tax/{id}`: `value` in particular is
 * recomputed server-side on every write, so the row rendered in the list can
 * disagree with what is actually stored.
 */
@Component({
  selector: 'app-invoice-tax-modal',
  templateUrl: './invoice-tax-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceTaxModalComponent implements OnInit {

  private config       = inject(DynamicDialogConfig);
  private ref          = inject(DynamicDialogRef);
  private formBuilder  = inject(FormBuilder);
  private utilSV       = inject(UtilService);
  private staticListSV = inject(StaticListsService);
  private invoiceSV    = inject(InvoiceService);

  listTaxType = computed<StaticListItem[]>(() => this.staticListSV.getListInvoiceTaxType());

  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());

  type          = computed<'create' | 'edit'>(() => this.config.data.type);
  invoiceId     = computed<string>(() => this.config.data.invoiceId);
  currency      = computed<string>(() => this.config.data.currency ?? 'USD');
  productsTotal = computed<number>(() => this.config.data.productsTotal ?? 0);

  private _tax = signal<InvoiceTax | undefined>(this.config.data.tax);
  tax = computed<InvoiceTax | undefined>(() => this._tax());

  formTax!: FormGroup;

  ngOnInit(): void {
    this.buildForm();

    const tax = this.tax();
    if (this.type() !== 'edit' || !tax) return;

    this._loading.set(true);
    this.invoiceSV.getInvoiceTax(this.invoiceId(), tax.id)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: resp => {
          this._tax.set(resp);
          this.buildForm();
        },
        error: err => this.utilSV.setMessage(TITLES.warning, err?.errorMessage ?? err, 'warn')
      });
  }

  // Mirrors the server-side formula so the user sees the amount before saving.
  // The control is disabled and never reaches the request.
  previewValue(): void {
    const raw = this.formTax.getRawValue();
    const rate = (raw.rate ?? 0) / 100;
    this.formTax.patchValue({ value: rate * (raw.taxableBase ?? 0) });
  }

  onSubmit(): void {
    if (this.formTax.invalid) return;
    if (this.formTax.pristine) {
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
          this.ref.close({ valid: true, tax: resp.data });
        },
        error: err => this.utilSV.setMessage(TITLES.error, err?.errorMessage ?? err, 'error')
      });
    }, TIMEOUT);
  }

  closeModal(): void {
    this.ref.close({ valid: false });
  }

  private submitAction(): Observable<MessageResponse<InvoiceTax>> {
    const raw = this.formTax.getRawValue();
    const request: InvoiceTaxRequest = {
      type: raw.type,
      description: raw.description,
      rate: raw.rate / 100,
      taxableBase: raw.taxableBase
    };

    return this.type() === 'create'
      ? this.invoiceSV.createInvoiceTax(this.invoiceId(), request)
      : this.invoiceSV.updateInvoiceTax(this.invoiceId(), this.tax()!.id, request);
  }

  private buildForm(): void {
    const tax = this.tax();

    this.formTax = this.formBuilder.group({
      type: [tax?.type ?? null, [Validators.required]],
      description: [tax?.description ?? null, [Validators.required, Validators.maxLength(100)]],
      rate: [tax ? tax.rate * 100 : null, [Validators.required, Validators.min(0), Validators.max(100)]],
      taxableBase: [tax?.taxableBase ?? this.productsTotal(), [Validators.required, Validators.min(0)]],
      value: [{ value: tax?.value ?? null, disabled: true }]
    });
  }

}
