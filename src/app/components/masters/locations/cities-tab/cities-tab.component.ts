import { Component, computed, inject, Signal, signal } from '@angular/core';
import { City } from '@interfaces/masters/locations/cities';
import { MessageResponse } from '@interfaces/message-response';
import { CityService } from '@services/masters';
import { PermissionService } from '@services/security';
import { UtilService } from '@services/util';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Table } from 'primeng/table';
import { moduleActionsId } from '../../../../../environments';
import { CityModalComponent } from '@modals/masters/locations/city-modal/city-modal.component';
import { environment } from '../../../../../environments/environment';

const CITIES_ACTIONS_ID = moduleActionsId.masters.locations;
const TIMEOUT = environment.timeout;

@Component({
  selector: 'app-cities-tab',
  templateUrl: './cities-tab.component.html',
  styles: ['']
})
export class CitiesTabComponent {
  //! Inyecciones
  private permissionsSV  = inject(PermissionService);
  private citySV         = inject(CityService);
  private utilSV         = inject(UtilService);
  private dialogSV       = inject(DialogService);
  //! ----------------------------------------------------------


  //* Señales
  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());

  private _listCities = signal<City[]>([]);
  listCities = computed<City[]>(() => this._listCities());

  private _cityPermissions = signal({
    createCity: false,
    updateCity: false,
  });
  cityPermissions = computed(() => this._cityPermissions());


  modalCityRef!: Signal<DynamicDialogRef | undefined>;
  //* -----------------------------------------------------------

  ngOnInit() {
    this.loadCityActions();
    this.loadListCities();
  }

  openModalCity(type: 'create' | 'edit', city?: City) {
    this.modalCityRef = computed( () => this.dialogSV.open(CityModalComponent,{
      header: `${(type === 'edit'? 'UPDATE' : 'CREATE')} CITY` ,
      width: '40rem',
      closable: false,
      closeOnEscape: false,
      data: {
        type,
        city
      }
    }));
    this.modalCityRef()?.onClose.subscribe((resp: {cityResponse: MessageResponse<City>}) => {
      if (resp && resp.cityResponse) {
        this.utilSV.setMessage(resp.cityResponse.title, resp.cityResponse.message, 'success');
        this.loadListCities();
      }
      this.modalCityRef = computed(() => undefined);
    });
  }



  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  loadListCities() {
    this._loading.set(true);
    setTimeout(() => {
      this.citySV.listAll().subscribe({
        next: resp => {
          this._loading.set(false);
          this._listCities.set(resp);
        },
        error: err => {
          this.utilSV.setMessage('¡Error!', err, 'error');
          this._loading.set(false);
        }
      });
    }, TIMEOUT);
  }

  private async loadCityActions() {
    this._cityPermissions.set({
      createCity: await this.permissionsSV.isValidAction(CITIES_ACTIONS_ID.CREATE_CITY),
      updateCity: await this.permissionsSV.isValidAction(CITIES_ACTIONS_ID.UPDATE_CITY)
    });
  }
}
