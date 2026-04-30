import { Component, computed, inject, Signal, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BasicCountry } from '@interfaces/masters/locations/countries';
import { State, StateRequest } from '@interfaces/masters/locations/states';
import { MessageResponse } from '@interfaces/message-response';
import { CountriesService, StatesService } from '@services/masters';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';

const TIMEOUT = environment.timeout;

@Component({
  selector: 'app-state-modal',
  templateUrl: './state-modal.component.html',
  styleUrl: './state-modal.component.scss'
})
export class StateModalComponent {
  //! Inyecciones
  private config      = inject(DynamicDialogConfig);
  private ref         = inject(DynamicDialogRef);
  private countrieSV  = inject(CountriesService);
  private stateSV     = inject(StatesService);
  private formBuilder = inject(FormBuilder);
  //! -----------------------------------------------

    //* Señales
    private _loading = signal<boolean>(false);
    loading = computed<boolean>(() => this._loading());

    private _type = signal<'edit' | 'create'>(this.config.data.type);
    type = computed<'edit' | 'create'>(() => this._type());

    private _state = signal<State>(this.config.data.state);
    state = computed<State>(() => this._state());

    private _error = signal<string | null>(null);
    error = computed<string | null>(() => this._error());
    //*------------------------------------------------

    formState!: FormGroup;

    constructor() {
      this.loadCountries();
      setTimeout(() => {
        if (this.type() === 'edit') {
          this.stateSV.findById(this.state().id).subscribe({
            next: resp => {
              this._state.set(resp);
              console.log(resp);
              this.buildForm();
            },
            error: err => {
              this._error.set(err);
              this.formState.disable();
            }
          });
        } else {
          this.buildForm();
        }
      }, TIMEOUT);
    }

    loadCountries() {
      this.countrieSV.loadCountries();
    }

    get listCountries(): Signal<BasicCountry[]> {
      return this.countrieSV.listCountries;
    }


    onSubmit() {
      if (this.formState.pristine) {
        this.ref.close();
        return;
      }
      const data:StateRequest = this.formState.value;
      if (this.type() === 'edit' && this.state()) {
        this.serviceAction(this.stateSV.update(this.state().id, data));
      } else if (this.type() === 'create') {
        this.serviceAction(this.stateSV.create(data));
      }
    }

    closeModal() {
      this.ref.close();
    }

    private serviceAction(observable: Observable<MessageResponse<State>>) {
      this._loading.set(true);
      this._error.set(null);
      this.formState.disable();
      setTimeout(() => {
        observable.subscribe({
          next: resp => {
            this.ref.close({stateResponse: resp})
          },
          error: err => {
            this._error.set(err);
            this._loading.set(false);
            this.formState.enable();
          }
        });
      }, TIMEOUT);
    }

    private buildForm() {
      this.formState = this.formBuilder.group({
        name: [
          this.state()?.name ?? null,
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(70)
          ]
        ],
        nameShort: [
          this.state()?.nameShort ?? null,
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(3)
          ]
        ],
        countryId: [
          this.state()?.country?.id ?? null,
          [
            Validators.required
          ]
        ],
        longitude: [
          this.state()?.longitude ?? null,
          [
            Validators.required
          ]
        ],
        latitude: [
          this.state()?.latitude ?? null,
          [
            Validators.required
          ]
        ],
        showShortName: [
          this.state()?.showShortName ?? false
        ]
      });
    }
}
