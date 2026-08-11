import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Messages, TitlesMessages } from '@config/messages';
import { InvoicePayment } from '@interfaces/sales/invoice';
import { InvoiceService } from '@services/sales';
import { UtilService } from '@services/util';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { finalize } from 'rxjs';
import { InvoiceReasonModalComponent } from '../invoice-reason-modal/invoice-reason-modal.component';
import { RegisterPaymentModalComponent } from '../register-payment-modal/register-payment-modal.component';

const MESSAGES = Messages.pages.sales.invoice;
const TITLES   = TitlesMessages;

/**
 * Payments of the invoice (§16). Same shape as the charges/taxes lists: it owns
 * its copy of the rows, and the parent reloads the invoice once when this
 * closes with `valid: true` — every payment moves `paidAmount`, `balanceDue`
 * and the `status`.
 *
 * Voided payments stay visible, struck through: they are part of the audit
 * trail, and hiding them would make a corrected mistake look like it never
 * happened. `balanceDue` is recomputed locally after each mutation so the
 * register modal opens with the right cap without a round trip.
 */
@Component({
  selector: 'app-list-invoice-payments-modal',
  templateUrl: './list-invoice-payments-modal.component.html',
  styleUrl: './list-invoice-payments-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListInvoicePaymentsModalComponent implements OnInit {

  private config    = inject(DynamicDialogConfig);
  private ref       = inject(DynamicDialogRef);
  private dialogSV  = inject(DialogService);
  private utilSV    = inject(UtilService);
  private invoiceSV = inject(InvoiceService);

  private _loading = signal<boolean>(true);
  loading = computed<boolean>(() => this._loading());

  private _payments = signal<InvoicePayment[]>([]);
  payments = computed<InvoicePayment[]>(() => this._payments());

  invoiceId   = computed<string>(() => this.config.data.invoiceId);
  currency    = computed<string>(() => this.config.data.currency ?? 'USD');
  totalAmount = computed<number>(() => this.config.data.totalAmount ?? 0);
  canRegister = computed<boolean>(() => this.config.data.canRegister === true);
  canVoid     = computed<boolean>(() => this.config.data.canVoid === true);

  // Derived from the rows instead of the invoice snapshot: after registering or
  // voiding, the modal is ahead of the `item()` the parent still holds.
  paidAmount = computed<number>(() =>
    this._payments()
      .filter(payment => !payment.voided)
      .reduce((total, payment) => total + payment.amount, 0)
  );
  balanceDue = computed<number>(() => this.totalAmount() - this.paidAmount());

  // A payment already hit the server, so the parent must reload even if the
  // user leaves through "Close".
  private changed = false;

  ngOnInit(): void {
    this.invoiceSV.listInvoicePayments(this.invoiceId())
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: resp => this._payments.set(resp ?? []),
        error: err => {
          this._payments.set([]);
          this.utilSV.setMessage(TITLES.error, err?.errorMessage ?? err, 'error');
        }
      });
  }

  openRegisterModal(): void {
    const modal = this.dialogSV.open(RegisterPaymentModalComponent, {
      header: 'REGISTER PAYMENT',
      width: '55rem',
      closable: false,
      closeOnEscape: false,
      data: {
        invoiceId: this.invoiceId(),
        currency: this.currency(),
        totalAmount: this.totalAmount(),
        paidAmount: this.paidAmount(),
        balanceDue: this.balanceDue()
      }
    });

    modal.onClose.subscribe({
      next: (resp: { valid: boolean, payment: InvoicePayment }) => {
        if (!resp?.valid) return;
        this.changed = true;
        this._payments.set([...this._payments(), resp.payment]);
      }
    });
  }

  voidPayment(payment: InvoicePayment): void {
    const modal = this.dialogSV.open(InvoiceReasonModalComponent, {
      header: 'VOID PAYMENT',
      width: '45rem',
      closable: false,
      closeOnEscape: false,
      data: {
        label: 'Void reason',
        message: MESSAGES.voidPayment(`${this.currency()} ${payment.amount}`),
        confirmText: 'Void Payment'
      }
    });

    modal.onClose.subscribe({
      next: (resp: { valid: boolean, reason: string }) => {
        if (!resp?.valid) return;

        this._loading.set(true);
        this.invoiceSV.voidInvoicePayment(this.invoiceId(), payment.id, resp.reason)
          .pipe(finalize(() => this._loading.set(false)))
          .subscribe({
            next: response => {
              this.utilSV.setMessage(response.title, response.message, 'success');
              this.changed = true;
              this._payments.set(this._payments().map(item => item.id === response.data.id ? response.data : item));
            },
            error: err => this.utilSV.setMessage(TITLES.error, err?.errorMessage ?? err, 'error')
          });
      }
    });
  }

  closeModal(): void {
    this.ref.close({ valid: this.changed });
  }

}
