import { Component, computed, inject, Signal, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { City, CityRequest } from '@interfaces/masters/locations/cities';
import { BasicCountry } from '@interfaces/masters/locations/countries';
import { BasicState } from '@interfaces/masters/locations/states';
import { MessageResponse } from '@interfaces/message-response';
import { CityService, CountriesService, StatesService } from '@services/masters';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

const TIMEOUT = environment.timeout;

@Component({
  selector: 'app-city-modal',
  templateUrl: './city-modal.component.html',
  styleUrl: './city-modal.component.scss'
})
export class CityModalComponent {

  //! Inyecciones
  private config      = inject(DynamicDialogConfig);
  private ref         = inject(DynamicDialogRef);
  private countrieSV  = inject(CountriesService);
  private stateSV     = inject(StatesService);
  private citySV      = inject(CityService)
  private formBuilder = inject(FormBuilder);
  //! -----------------------------------------------

  //* Señales
  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());

  private _type = signal<'edit' | 'create'>(this.config.data.type);
  type = computed<'edit' | 'create'>(() => this._type());

  private _city = signal<City>(this.config.data.city);
  city = computed<City>(() => this._city());

  listStates = computed<BasicState[]>(() => this.listStatesPr);

  private _error = signal<string | null>(null);
  error = computed<string | null>(() => this._error());
  //*------------------------------------------------

  formCity!: FormGroup;

  constructor() {
    this.loadCountries();
    this.loadStates();
    setTimeout(() => {
      if (this.type() === 'edit') {
        this.citySV.findById(this.city().id).subscribe({
          next: resp => {
            this._city.set(resp);
            this.buildForm();
          },
          error: err => {
            this._error.set(err);
            this.formCity.disable();
          }
        });
      } else {
        this.buildForm();
      }
    }, TIMEOUT);
  }


  loadStates() {
    this.stateSV.loadStates();
  }

  private get listStatesPr(): BasicState[] {
    return this.stateSV.listStates();
  }

  loadCountries() {
    this.countrieSV.loadCountries();
  }

  get listCountries(): Signal<BasicCountry[]> {
    return this.countrieSV.listCountries;
  }

  onSubmit() {
    if (this.formCity.pristine) {
      this.ref.close();
      return;
    }
    const data: CityRequest = this.formCity.value;
    if (this.type() === 'edit' && this.city()) {
      this.serviceAction(this.citySV.update(this.city().id, data));
    } else if (this.type() === 'create') {
      this.serviceAction(this.citySV.create(data));
    }
  }

  closeModal() {
    this.ref.close();
  }

  private serviceAction(observable: Observable<MessageResponse<City>>) {
    this._loading.set(true);
    this._error.set(null);
    this.formCity.disable();
    setTimeout(() => {
      observable.subscribe({
        next: resp => {
          this.ref.close({cityResponse: resp})
        },
        error: err => {
          this._error.set(err);
          this._loading.set(false);
          this.formCity.enable();
        }
      });
    }, TIMEOUT);
  }

  filterStates() {
    this.formCity.controls['stateId'].enable();
    this.listStates = computed<BasicState[]>(() => this.listStatesPr.filter(state => state.country.id === this.formCity.value.countryId));
  }

  private buildForm() {
    this.formCity = this.formBuilder.group({
      name: [
        this.city()?.name ?? null,
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(70)
        ]
      ],
      stateId: [
        this.city()?.state?.id ?? null,
        [
          Validators.required
        ]
      ],
      countryId: [
        this.city()?.state?.country?.id ?? null,
        [
          Validators.required
        ]
      ],
      longitude: [
        this.city()?.longitude ?? null,
        [
          Validators.required
        ]
      ],
      latitude: [
        this.city()?.latitude ?? null,
        [
          Validators.required
        ]
      ]
    });
    if (this.type() === 'create') {
      this.formCity.controls['stateId'].disable();
    } else {
      this.filterStates();
    }
  }

}
