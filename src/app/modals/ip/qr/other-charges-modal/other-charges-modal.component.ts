import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IpQuoteRequestService } from '@services/ip';
import { UtilService } from '@services/util';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { environment } from '../../../../../environments/environment';
import { TitlesMessages } from '@config/messages';
import { finalize, Observable } from 'rxjs';
import { IpQuoteRequestOtherCharges, mapToIpQrOtherChargeRequest } from '@interfaces/ip/quoteRequest';
import { MessageResponse } from '@interfaces/message-response';

const TIMEOUT = environment.timeout;
const TITLES = TitlesMessages;

@Component({
  selector: 'app-other-charges-modal',
  templateUrl: './other-charges-modal.component.html',
  styleUrl: './other-charges-modal.component.scss'
})
export class OtherChargesModalComponent implements OnInit {

  //! Inyecciones
  private config      = inject(DynamicDialogConfig);
  private ref         = inject(DynamicDialogRef);
  private formBuilder = inject(FormBuilder);
  private utilSV      = inject(UtilService);
  private qrSV        = inject(IpQuoteRequestService);
  //! -----------------------------------------------

  //* Señales
  private _loading = signal<boolean>(true);
  loading = computed<boolean>(() => this._loading());
  type = computed<'create' | 'edit'>(() => this.config.data.type);
  qrId = computed<string>(() => this.config.data.qrId);
  currency = computed<string>(() => this.config.data.currency);
  qrOtherChargeId = computed<string>(() => this.config.data.qrOtherChargeId);
  //*------------------------------------------------

  formOtherCharge!: FormGroup;

  ngOnInit(): void {
    setTimeout(() => this.initForm(), TIMEOUT);
  }

  onSubmit(): void {
    if (this.formOtherCharge.pristine) {
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
          this.ref.close({valid: true, otherCharge: resp.data});
        },
        error: (err) => this.utilSV.setMessage(TITLES.error, err, 'error'),
      })
    }, TIMEOUT);
  }

  private submitAction(): Observable<MessageResponse<IpQuoteRequestOtherCharges>> {
    const data = mapToIpQrOtherChargeRequest(this.formOtherCharge.value);
    if (this.type() === 'create') {
      return this.qrSV.createQuoteRequestOtherCharge(this.qrId(), data);
    } else {
      return this.qrSV.updateQuoteRequestOtherCharge(this.qrOtherChargeId(), this.qrId(), data);
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
    this.qrSV.getQuoteRequestOtherCharge(this.qrOtherChargeId(), this.qrId())
    .pipe(
      finalize(() => this._loading.set(false))
    )
    .subscribe({
      next: (resp) => this.buildForm(resp),
      error: (err) => this.utilSV.setMessage(TITLES.error, err, 'error'),
    });
  }

  private buildForm(otherCharge?: IpQuoteRequestOtherCharges): void {
    this.formOtherCharge = this.formBuilder.group({
      description: [
        otherCharge?.description ?? null,
        [
          Validators.required
        ]
      ],
      value: [
        otherCharge?.value ?? null,
        [
          Validators.required,
          Validators.min(0)
        ]
      ]
    });
  }
}
