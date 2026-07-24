import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IpPurchaseOrderService } from '@services/ip';
import { UtilService } from '@services/util';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { environment } from '../../../../../environments/environment';
import { TitlesMessages } from '@config/messages';
import { finalize, Observable } from 'rxjs';
import { IpPurchaseOrderOtherCharge } from '@interfaces/ip/purchaseOrder';
import { MessageResponse } from '@interfaces/message-response';

const TIMEOUT = environment.timeout;
const TITLES = TitlesMessages;

@Component({
  selector: 'app-po-other-charges-modal',
  templateUrl: './po-other-charges-modal.component.html',
  styleUrl: './po-other-charges-modal.component.scss'
})
export class PoOtherChargesModalComponent implements OnInit {

  private config      = inject(DynamicDialogConfig);
  private ref         = inject(DynamicDialogRef);
  private formBuilder = inject(FormBuilder);
  private utilSV      = inject(UtilService);
  private poSV        = inject(IpPurchaseOrderService);

  private _loading = signal<boolean>(true);
  loading = computed<boolean>(() => this._loading());
  type = computed<'create' | 'edit'>(() => this.config.data.type);
  poId = computed<string>(() => this.config.data.poId);
  chargeId = computed<string | undefined>(() => this.config.data.chargeId);

  formOtherCharge!: FormGroup;

  ngOnInit(): void {
    setTimeout(() => this.buildForm(this.config.data.charge), TIMEOUT);
  }

  onSubmit(): void {
    if (this.formOtherCharge.invalid) return;
    if (this.formOtherCharge.pristine) {
      this.ref.close({ valid: true });
      return;
    }
    this._loading.set(true);
    setTimeout(() => {
      this.submitAction()
        .pipe(finalize(() => this._loading.set(false)))
        .subscribe({
          next: resp => {
            this.utilSV.setMessage(resp.title, resp.message, 'success');
            this.ref.close({ valid: true, otherCharge: resp.data });
          },
          error: err => this.utilSV.setMessage(TITLES.error, err, 'error')
        });
    }, TIMEOUT);
  }

  private submitAction(): Observable<MessageResponse<IpPurchaseOrderOtherCharge>> {
    const data = this.formOtherCharge.value;
    return this.type() === 'create'
      ? this.poSV.addOtherCharge(this.poId(), data)
      : this.poSV.updateOtherCharge(this.poId(), this.chargeId()!, data);
  }

  closeModal(): void {
    this.ref.close({ valid: false });
  }

  private buildForm(charge?: IpPurchaseOrderOtherCharge): void {
    this.formOtherCharge = this.formBuilder.group({
      description: [charge?.description ?? null, [Validators.required]],
      value: [charge?.value ?? null, [Validators.required, Validators.min(0)]]
    });
    this._loading.set(false);
  }
}
