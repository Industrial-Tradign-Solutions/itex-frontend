import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FreightChargesFormValue, FreightChargesModalData, FreightChargesModalResult, normalizeFreightChargesModalData } from '@interfaces/ip/quotation';

const SCALE = 5;
const MAX_MONEY = 999999999999;

@Component({
  selector: 'app-edit-freight-charges-modal',
  templateUrl: './edit-freight-charges-modal.component.html',
  styleUrl: './edit-freight-charges-modal.component.scss'
})
export class EditFreightChargesModalComponent implements OnInit {

  //! Inyecciones
  private config      = inject(DynamicDialogConfig);
  private ref         = inject(DynamicDialogRef);
  private formBuilder = inject(FormBuilder);
  //! -----------------------------------------------

  //* Señales
  private _data = signal<FreightChargesModalData>(normalizeFreightChargesModalData(this.config.data));
  currency = computed<string>(() => this._data().currency);
  //*------------------------------------------------

  formFreight!: FormGroup;

  ngOnInit(): void {
    this.buildForm();
  }

  onSubmit(): void {
    if (this.formFreight.pristine) {
      this.closeModal();
      return;
    }

    const raw = this.formFreight.getRawValue() as unknown as FreightChargesFormValue;
    const result: FreightChargesModalResult = {
      valid: true,
      freightCharges: {
        profitMarginFreightCharges: raw.profitMarginFreightCharges ?? 0,
        freightChargeMiamiITS: raw.freightChargeMiamiITS ?? 0
      }
    };
    this.ref.close(result);
  }

  closeModal(): void {
    const result: FreightChargesModalResult = { valid: false };
    this.ref.close(result);
  }

  private buildForm(): void {
    const {
      freightCharges: base,
      profitMarginFreightCharges: margin,
      freightChargeMiamiITS
    } = this._data();

    this.formFreight = this.formBuilder.group({
      freightCharges: [
        { value: base, disabled: true }
      ],
      profitMarginFreightCharges: [
        margin,
        [Validators.required, Validators.min(0), Validators.max(MAX_MONEY)]
      ],
      freightChargeMiamiITS: [
        freightChargeMiamiITS,
        [Validators.required, Validators.min(0), Validators.max(MAX_MONEY)]
      ],
      totalFreightCharges: [
        { value: this.toPreview(base + margin), disabled: true }
      ]
    });

    this.formFreight.controls['profitMarginFreightCharges'].valueChanges
      .subscribe(value => this.formFreight.controls['totalFreightCharges']
        .patchValue(this.toPreview(base + (typeof value === 'number' ? value : 0))));
  }

  /** Evita el ruido de punto flotante en el preview (el backend no redondea). */
  private toPreview(value: number): number {
    return Number(value.toFixed(SCALE));
  }
}
