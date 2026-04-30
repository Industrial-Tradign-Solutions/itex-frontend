import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CountriesService } from '../../../../services/masters/countries.service';
import { Country, CountryRequest } from '../../../../models/masters/locations/countries';
import { MessageResponse } from '../../../../models/message-response';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

const TIMEOUT = environment.timeout;

@Component({
  selector: 'app-countrie-modal',
  templateUrl: './country-modal.component.html',
  styleUrls: ['./country-modal.component.scss']
})
export class CountryModalComponent {

  //! Inyecciones
  private config      = inject(DynamicDialogConfig);
  private ref         = inject(DynamicDialogRef);
  private countrieSV  = inject(CountriesService);
  private formBuilder = inject(FormBuilder);
  //! -----------------------------------------------

  //* Señales
  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());

  private _type = signal<'edit' | 'create'>(this.config.data.type);
  type = computed<'edit' | 'create'>(() => this._type());

  private _country = signal<Country>(this.config.data.country);
  country = computed<Country>(() => this._country());

  private _error = signal<string | null>(null);
  error = computed<string | null>(() => this._error());
  //*------------------------------------------------


  formCountrie!: FormGroup;

  constructor() {
    setTimeout(() => {
      if (this.type() === 'edit') {
        this.countrieSV.findById(this.country().id).subscribe({
          next: resp => {
            this._country.set(resp);
            this.buildForm();
          },
          error: err => {
            this._error.set(err);
            this.formCountrie.disable();
          }
        });
      } else {
        this.buildForm();
      }
    }, TIMEOUT);
  }

  onSubmit() {
    if (this.formCountrie.pristine) {
      this.ref.close();
      return;
    }
    const data:CountryRequest = this.formCountrie.value;
    if (this.type() === 'edit' && this.country()) {
      this.serviceAction(this.countrieSV.update(this.country().id, data));
    } else if (this.type() === 'create') {
      this.serviceAction(this.countrieSV.create(data));
    }
  }

  private serviceAction(observable: Observable<MessageResponse<Country>>) {
    this._loading.set(true);
    this._error.set(null);
    this.formCountrie.disable();
    setTimeout(() => {
      observable.subscribe({
        next: resp => {
          this.ref.close({countryResponse: resp})
        },
        error: err => {
          this._error.set(err);
          this._loading.set(false);
          this.formCountrie.enable();
        }
      });
    }, TIMEOUT);
  }

  closeModal() {
    this.ref.close();
  }

  private buildForm() {
    this.formCountrie = this.formBuilder.group({
      name: [
        this.country()?.name ?? null,
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(70)
        ]
      ],
      nameShort: [
        this.country()?.nameShort ?? null,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(3)
        ]
      ],
      longitude: [
        this.country()?.longitude ?? null,
        [
          Validators.required
        ]
      ],
      latitude: [
        this.country()?.latitude ?? null,
        [
          Validators.required
        ]
      ]
    });
  }

}
