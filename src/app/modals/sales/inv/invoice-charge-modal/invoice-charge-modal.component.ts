import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TitlesMessages } from '@config/messages';
import { MessageResponse } from '@interfaces/message-response';
import { InvoiceCharge, InvoiceChargeRequest } from '@interfaces/sales/invoice';
import { StaticListItem } from '@interfaces/static-list.model';
import { InvoiceService } from '@services/sales';
import { StaticListsService, UtilService } from '@services/util';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { finalize, Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

const TIMEOUT = environment.timeout;
const TITLES  = TitlesMessages;

/**
 * Create/edit of a single charge (§12.1 / §12.2). `value` carries no `min`:
 * `DISCOUNT` charges are entered as negatives.
 *
 * On edit the charge is re-read from `GET .../charge/{id}` instead of using the
 * row the list handed over: that row is a projection rendered for the table and
 * may be stale by the time the user clicks Edit. The list row is still used as
 * the initial value so the form paints immediately and the id is available even
 * if the request fails.
 */
@Component({
  selector: 'app-invoice-charge-modal',
  templateUrl: './invoice-charge-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceChargeModalComponent implements OnInit {

  private config       = inject(DynamicDialogConfig);
  private ref          = inject(DynamicDialogRef);
  private formBuilder  = inject(FormBuilder);
  private utilSV       = inject(UtilService);
  private staticListSV = inject(StaticListsService);
  private invoiceSV    = inject(InvoiceService);

  listChargeType = computed<StaticListItem[]>(() => this.staticListSV.getListInvoiceChargeType());

  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());

  type      = computed<'create' | 'edit'>(() => this.config.data.type);
  invoiceId = computed<string>(() => this.config.data.invoiceId);
  currency  = computed<string>(() => this.config.data.currency ?? 'USD');

  private _charge = signal<InvoiceCharge | undefined>(this.config.data.charge);
  charge = computed<InvoiceCharge | undefined>(() => this._charge());

  formCharge!: FormGroup;

  ngOnInit(): void {
    this.buildForm();

    const charge = this.charge();
    if (this.type() !== 'edit' || !charge) return;

    this._loading.set(true);
    this.invoiceSV.getInvoiceCharge(this.invoiceId(), charge.id)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: resp => {
          this._charge.set(resp);
          // Rebuilt, not patched: a rebuild also resets the pristine flag, so a
          // value that changed server-side does not look like a user edit.
          this.buildForm();
        },
        // The list row is already on screen and editable; failing to refresh is
        // not a reason to block the edit.
        error: err => this.utilSV.setMessage(TITLES.warning, err?.errorMessage ?? err, 'warn')
      });
  }

  onSubmit(): void {
    if (this.formCharge.invalid) return;
    if (this.formCharge.pristine) {
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
          // The charge travels back so the list can update itself without
          // re-reading the whole invoice; totals are refreshed once, by the
          // form, when the list modal closes.
          this.ref.close({ valid: true, charge: resp.data });
        },
        error: err => this.utilSV.setMessage(TITLES.error, err?.errorMessage ?? err, 'error')
      });
    }, TIMEOUT);
  }

  closeModal(): void {
    this.ref.close({ valid: false });
  }

  private submitAction(): Observable<MessageResponse<InvoiceCharge>> {
    const request = this.formCharge.getRawValue() as InvoiceChargeRequest;
    return this.type() === 'create'
      ? this.invoiceSV.createInvoiceCharge(this.invoiceId(), request)
      : this.invoiceSV.updateInvoiceCharge(this.invoiceId(), this.charge()!.id, request);
  }

  private buildForm(): void {
    const charge = this.charge();

    this.formCharge = this.formBuilder.group({
      description: [charge?.description ?? null, [Validators.required, Validators.maxLength(100)]],
      type: [charge?.type ?? null, [Validators.required]],
      value: [charge?.value ?? null, [Validators.required]]
    });
  }

}
