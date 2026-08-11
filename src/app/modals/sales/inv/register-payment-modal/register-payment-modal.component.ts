import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TitlesMessages } from '@config/messages';
import { InvoicePaymentRequest } from '@interfaces/sales/invoice';
import { StaticListItem } from '@interfaces/static-list.model';
import { InvoiceService } from '@services/sales';
import { StaticListsService, UtilService } from '@services/util';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FileSelectEvent } from 'primeng/fileupload';
import { finalize } from 'rxjs';

const TITLES = TitlesMessages;

/**
 * Registers a payment against the invoice (§16.1).
 *
 * Two rules of the endpoint drive the whole form: the receipt is **mandatory**
 * (no file, no payment) and the amount can never exceed the outstanding
 * balance — over-payment is rejected server-side, so the input is capped and
 * pre-filled with the full balance, which is the common case (paying it off in
 * one click).
 *
 * `paymentDate` is bound as a Date by the calendar and serialised to
 * `YYYY-MM-DD` on submit: the backend binds a LocalDate, and sending an ISO
 * instant would shift the day across time zones.
 */
@Component({
  selector: 'app-register-payment-modal',
  templateUrl: './register-payment-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterPaymentModalComponent implements OnInit {

  private config       = inject(DynamicDialogConfig);
  private ref          = inject(DynamicDialogRef);
  private formBuilder  = inject(FormBuilder);
  private utilSV       = inject(UtilService);
  private staticListSV = inject(StaticListsService);
  private invoiceSV    = inject(InvoiceService);

  listPaymentMethods = computed<StaticListItem[]>(() => this.staticListSV.getListPaymentMethods());

  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());

  invoiceId   = computed<string>(() => this.config.data.invoiceId);
  currency    = computed<string>(() => this.config.data.currency ?? 'USD');
  totalAmount = computed<number>(() => this.config.data.totalAmount ?? 0);
  paidAmount  = computed<number>(() => this.config.data.paidAmount ?? 0);
  balanceDue  = computed<number>(() => this.config.data.balanceDue ?? 0);

  private _receipt = signal<File | null>(null);
  receipt = computed<File | null>(() => this._receipt());

  today = new Date();

  formPayment!: FormGroup;

  ngOnInit(): void {
    this.formPayment = this.formBuilder.group({
      amount: [this.balanceDue(), [Validators.required, Validators.min(0.00001), Validators.max(this.balanceDue())]],
      paymentDate: [new Date(), [Validators.required]],
      paymentMethod: [null, [Validators.required]],
      notes: [null, [Validators.maxLength(1000)]]
    });
  }

  selectReceipt(event: FileSelectEvent): void {
    this._receipt.set(event.currentFiles?.[0] ?? null);
  }

  removeReceipt(): void {
    this._receipt.set(null);
  }

  canSubmit(): boolean {
    return this.formPayment?.valid === true && this.receipt() !== null;
  }

  onSubmit(): void {
    const receipt = this.receipt();
    if (!this.formPayment.valid || !receipt) return;

    const raw = this.formPayment.getRawValue();
    const request: InvoicePaymentRequest = {
      amount: raw.amount,
      paymentDate: this.toLocalDate(raw.paymentDate),
      paymentMethod: raw.paymentMethod,
      notes: raw.notes ? raw.notes : null
    };

    this._loading.set(true);
    this.invoiceSV.registerInvoicePayment(this.invoiceId(), request, receipt)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: resp => {
          this.utilSV.setMessage(resp.title, resp.message, 'success');
          this.ref.close({ valid: true, payment: resp.data });
        },
        error: err => {
          if (err?.formErrors) {
            Object.values(err.formErrors as Record<string, string>)
              .forEach(message => this.utilSV.setMessage(TITLES.error, message, 'error'));
            return;
          }
          this.utilSV.setMessage(TITLES.error, err?.errorMessage ?? err, 'error');
        }
      });
  }

  closeModal(): void {
    this.ref.close({ valid: false });
  }

  // Built from the local parts on purpose: `toISOString()` converts to UTC and
  // a payment registered at night would travel with the previous day.
  private toLocalDate(date: Date): string {
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day   = `${date.getDate()}`.padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

}
