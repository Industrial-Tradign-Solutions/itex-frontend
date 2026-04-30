import { Component, OnInit, Signal, computed, inject, signal } from '@angular/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Table } from 'primeng/table';
import { moduleActionsId } from '../../../../../environments';
import { PermissionService } from '@services/security';
import { CountriesService } from '@services/masters';
import { UtilService } from '@services/util';
import { Country } from '@interfaces/masters/locations/countries';
import { CountryModalComponent } from '@modals/masters/locations/country-modal/country-modal.component';
import { MessageResponse } from '@interfaces/message-response';
import { environment } from '../../../../../environments/environment';


const COUNTRIES_ACTIONS_ID = moduleActionsId.masters.locations;
const TIMEOUT = environment.timeout;

@Component({
  selector: 'app-countries-tab',
  templateUrl: './countries-tab.component.html',
  styles: ``
})
export class CountriesTabComponent implements OnInit {

  //! Inyecciones
  private permissionsSV  = inject(PermissionService);
  private countriesSV    = inject(CountriesService);
  private utilSV         = inject(UtilService);
  private dialogSV       = inject(DialogService);
  //! ----------------------------------------------------------


  //* Señales
  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());

  private _listCountries = signal<Country[]>([]);
  listCountries = computed<Country[]>(() => this._listCountries());

  private _countryPermissions = signal({
    createCountry: false,
    updateCountry: false,
  });
  countryPermissions = computed(() => this._countryPermissions());


  modalCountrieRef!: Signal<DynamicDialogRef | undefined>;
  //* -----------------------------------------------------------

  ngOnInit() {
    this.loadCountriesActions();
    this.loadListCountries();
  }

  openModalCountry(type: 'create' | 'edit', country?: Country) {
    this.modalCountrieRef = computed( () => this.dialogSV.open(CountryModalComponent,{
      header: `${(type === 'edit'? 'UPDATE' : 'CREATE')} COUNTRY` ,
      width: '40rem',
      closable: false,
      closeOnEscape: false,
      data: {
        type,
        country
      }
    }));
    this.modalCountrieRef()?.onClose.subscribe((resp: {countryResponse: MessageResponse<Country>}) => {
      if (resp && resp.countryResponse) {
        this.utilSV.setMessage(resp.countryResponse.title, resp.countryResponse.message, 'success');
        this.loadListCountries();
      }
      this.modalCountrieRef = computed(() => undefined);
    });
  }

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  loadListCountries() {
    this._loading.set(true);
    setTimeout(() => {
      this.countriesSV.listAll().subscribe({
        next: resp => {
          this._loading.set(false);
          this._listCountries.set(resp);
        },
        error: err => {
          this.utilSV.setMessage('¡Error!', err, 'error');
          this._loading.set(false);
        }
      });
    }, TIMEOUT);
  }

  private async loadCountriesActions() {
    this._countryPermissions.set({
      createCountry: await this.permissionsSV.isValidAction(COUNTRIES_ACTIONS_ID.CREATE_COUNTRY),
      updateCountry: await this.permissionsSV.isValidAction(COUNTRIES_ACTIONS_ID.UPDATE_COUNTRY)
    });
  }
}
