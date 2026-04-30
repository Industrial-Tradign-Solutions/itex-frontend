import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Industry, IndustryRequest } from '@interfaces/masters/industries';
import { MessageResponse } from '@interfaces/message-response';
import { IndustriesService } from '@services/masters';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

const TIMEOUT = environment.timeout;

@Component({
  selector: 'app-industries-modal',
  templateUrl: './industries-modal.component.html',
  styleUrl: './industries-modal.component.scss'
})
export class IndustriesModalComponent {

  //! Inyecciones
  private config      = inject(DynamicDialogConfig);
  private ref         = inject(DynamicDialogRef);
  private industrySV  = inject(IndustriesService)
  private formBuilder = inject(FormBuilder);
  //! -----------------------------------------------

  //* Señales
  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());
  private _type = signal<'edit' | 'create'>(this.config.data.type);
  type = computed<'edit' | 'create'>(() => this._type());
  private _industry = signal<Industry>(this.config.data.industry);
  industry = computed<Industry>(() => this._industry());
  private _error = signal<string | null>(null);
  error = computed<string | null>(() => this._error());
  //*------------------------------------------------

  formIndustry!: FormGroup;

  constructor() {
    setTimeout(() => {
      if (this.type() === 'edit') {
        this.industrySV.findById(this.industry().id).subscribe({
          next: resp => {
            this._industry.set(resp);
            this.buildForm();
          },
          error: err => {
            this._error.set(err);
            this.formIndustry.disable();
          }
        });
      } else {
        this.buildForm();
      }
    }, TIMEOUT);
  }

  closeModal() {
    this.ref.close();
  }

  onSubmit() {
    if (this.formIndustry.pristine) {
      this.ref.close();
      return;
    }
    const data: IndustryRequest = this.formIndustry.value;
    if (this.type() === 'edit' && this.industry()) {
      this.serviceAction(this.industrySV.update(this.industry().id, data));
    } else if (this.type() === 'create') {
      this.serviceAction(this.industrySV.create(data));
    }
  }

  private serviceAction(observable: Observable<MessageResponse<Industry>>) {
    this._loading.set(true);
    this._error.set(null);
    this.formIndustry.disable();
    setTimeout(() => {
      observable.subscribe({
        next: resp => {
          this.ref.close({industryResponse: resp})
        },
        error: err => {
          this._error.set(err);
          this._loading.set(false);
          this.formIndustry.enable();
        }
      });
    }, TIMEOUT);
  }

  private buildForm() {
    this.formIndustry = this.formBuilder.group({
      name: [
        this.industry()?.name ?? null,
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(70)
        ]
      ],
      description: [
        this.industry()?.description ?? null,
        [
        ]
      ]
    });
  }
}
