import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

const MAX_LENGTH = 1000;

/**
 * Collects a mandatory reason and hands it back — nothing else.
 *
 * Two flows of the module need exactly this: cancelling an invoice
 * (`cancelReason`, §15.3) and voiding a payment (`voidedReason`, §16.2). Both
 * validate the same way server-side (non-empty, max 1000), so the modal stays
 * generic and the caller owns the request: it is the one that knows which
 * endpoint to hit and what to do with the response.
 */
@Component({
  selector: 'app-invoice-reason-modal',
  templateUrl: './invoice-reason-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceReasonModalComponent implements OnInit {

  private config      = inject(DynamicDialogConfig);
  private ref         = inject(DynamicDialogRef);
  private formBuilder = inject(FormBuilder);

  label       = computed<string>(() => this.config.data.label ?? 'Reason');
  message     = computed<string | undefined>(() => this.config.data.message);
  confirmText = computed<string>(() => this.config.data.confirmText ?? 'Confirm');
  maxLength   = MAX_LENGTH;

  formReason!: FormGroup;

  ngOnInit(): void {
    this.formReason = this.formBuilder.group({
      reason: [null, [Validators.required, Validators.maxLength(MAX_LENGTH)]]
    });
  }

  onSubmit(): void {
    if (this.formReason.invalid) return;
    this.ref.close({ valid: true, reason: (this.formReason.value.reason as string).trim() });
  }

  closeModal(): void {
    this.ref.close({ valid: false });
  }

}
