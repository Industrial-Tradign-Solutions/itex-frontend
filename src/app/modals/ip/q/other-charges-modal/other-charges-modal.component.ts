import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IpQuotationService } from '@services/ip';
import { UtilService } from '@services/util';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { environment } from '../../../../../environments/environment';
import { TitlesMessages } from '@config/messages';
import { finalize, Observable } from 'rxjs';
import { IpQuotationOtherCharge, mapToIpQOtherChargeRequest } from '@interfaces/ip/quotation';
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
  private qSV         = inject(IpQuotationService);
  //! -----------------------------------------------

  //* Señales
  private _loading = signal<boolean>(true);
  loading = computed<boolean>(() => this._loading());
  type = computed<'create' | 'edit'>(() => this.config.data.type);
  qId = computed<string>(() => this.config.data.qId);
  currency = computed<string>(() => this.config.data.currency);
  qOtherChargeId = computed<string>(() => this.config.data.qOtherChargeId);
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

  private submitAction(): Observable<MessageResponse<IpQuotationOtherCharge>> {
    const data = mapToIpQOtherChargeRequest(this.formOtherCharge.value);
    if (this.type() === 'create') {
      return this.qSV.createQuotationOtherCharge(this.qId(), data);
    } else {
      return this.qSV.updateQuotationOtherCharge(this.qId(), this.qOtherChargeId(), data);
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
    this.qSV.getQuotationOtherCharge(this.qId(), this.qOtherChargeId())
    .pipe(
      finalize(() => this._loading.set(false))
    )
    .subscribe({
      next: (resp) => this.buildForm(resp),
      error: (err) => this.utilSV.setMessage(TITLES.error, err, 'error'),
    });
  }

  private buildForm(otherCharge?: IpQuotationOtherCharge): void {
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
