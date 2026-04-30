import { Component, computed, EventEmitter, inject, Input, Output, signal, Signal, ViewChild } from '@angular/core';
import { ClientPermissions } from '@pages/principal/partners/clients/clients.component';
import { ClientFilter, ListClients } from '@interfaces/partners/clients';
import { Paginator } from 'primeng/paginator';
import { Table } from 'primeng/table';
import { SortEvent } from 'primeng/api';
import { EmitedTab } from '@config/types/tabs';
import { ClientsService } from '@services/partners';
import { FormBuilder, FormGroup } from '@angular/forms';
import { CityService, CountriesService } from '@services/masters';
import { StaticListsService, UtilService } from '@services/util';
import { StaticListItem } from '@interfaces/static-list.model';
import { Page } from '@interfaces/page.model';
import { environment } from '../../../../../environments/environment';
import { finalize, Observable } from 'rxjs';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';

const TIMEOUT = environment.timeout;

@Component({
  selector: 'app-list-clients',
  templateUrl: './list-clients.component.html',
  styleUrl: './list-clients.component.scss'
})
export class ListClientsComponent {

  @Output() openedClient = new EventEmitter<EmitedTab<ListClients>>();
  @Input({required: true})clientPermissions!: Signal<ClientPermissions>;
  @ViewChild('paginator') paginator!: Paginator;
  @ViewChild('dt1') dt!: Table;

  //! Inyecciones
  private formBuilder   = inject(FormBuilder);
  private citiesSV      = inject(CityService);
  private countriesSV   = inject(CountriesService);
  private utilSV        = inject(UtilService);
  private staticListSV  = inject(StaticListsService);
  private clientsSV     = inject(ClientsService);
  //! ----------------------------------------------------------

  //* Señales
  listClientStatus = computed<StaticListItem[]>(() => this.staticListSV.getListClientStatus());

  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());

  private _page = signal<Page<ListClients>>({
    content: [],
    page: {
      number: 0,
      size: 10,
      totalElements: 0,
      totalPages: 0
    }
  });
  page = computed<Page<ListClients>>(() => this._page());
  //* -----------------------------------------------------------

  //? Variables
  formFilter!: FormGroup;
  disableShort: boolean = false;
  oldKeyAutoCompleteCity: string = '';
  //?------------------------------------------------------------

  constructor() {
    this.loadCities();
    this.formBuild()
  }

  searchByCity(event: KeyboardEvent) {
    if (event.key === 'Enter' && this.oldKeyAutoCompleteCity === 'Enter') {
      this.search(true);
      event.preventDefault();
    } else {
      this.oldKeyAutoCompleteCity = event.key;
    }
  }

  customSort(event: SortEvent) {
    if (!this.disableShort && this.page().content.length > 0) {
      this.formFilter.controls['shortBy'].setValue(event.field);
      this.formFilter.controls['shortOrder'].setValue(event.order);
      this.search(true);
    }
  }

  openCLient(emited: EmitedTab<ListClients>) {
    this.openedClient.emit(emited);
  }

  newClient() {
    this.openCLient({
      type: 'create',
      item: {
        id: '',
        name: 'New Client'
      },
      pristine: true
    });
  }

  search(resetPaginator: boolean, page: number = 0, size: number = 10) {
    if(resetPaginator && this.page().content.length > 0 && this.page().page.totalPages > 1) {
      this.paginator.changePage(0);
    }
    const filters: ClientFilter = this.formFilter?.value;
    if (filters.cityId) {
      if (!this.utilSV.validateUUID(filters.cityId)) {
        filters.cityId = undefined;
      }
    }
    this.disableShort = true;
    this.searchAction(this.clientsSV.listAllClientsPage(filters, page, size));
  }

  private searchAction(obs: Observable<Page<ListClients>>) {
    this.viewLoading();
    obs.pipe(
      finalize(() => this.closeLoading())
    ).subscribe({
      next: resp => {
        this._page.set(resp);
      },
      error: err => {
        this.utilSV.setMessage('¡Error!', err, 'error');
      }
    });
  }

  private viewLoading() {
    this._loading.set(true);
    this.formFilter?.disable();
  }

  private closeLoading() {
    setTimeout(() => {
      this.formFilter?.enable();
      this._loading.set(false);
      setTimeout(() => {
        this.disableShort = false;
      }, 100);
    }, TIMEOUT );
  }

  searchCity(event: AutoCompleteCompleteEvent) {
    this.citiesSV.searchAutoComplete(event);
  }

  loadCities() {
    this.citiesSV.loadCities();
  }

  resetForm(dt: Table) {
    this.formFilter.reset();
    dt.reset();
  }

  get filteredCities() {
    return this.citiesSV.filteredCities;
  }

  loadCountries() {
    this.countriesSV.loadCountries();
  }

  searchByCountry(event: KeyboardEvent) {
    if (event.key === 'Enter' && this.oldKeyAutoCompleteCity === 'Enter') {
      this.search(true);
      event.preventDefault();
    } else {
      this.oldKeyAutoCompleteCity = event.key;
    }
  }

  searchCountry(event: AutoCompleteCompleteEvent) {
    this.countriesSV.searchAutoComplete(event);
  }

  get filteredCountries() {
    return this.countriesSV.filteredCountries;
  }

  getStatusColor(status: 'ACTIVE' | 'INACTIVE' | 'PROSPECT'): string {
    if (status === 'ACTIVE') {
      return 'qualified';
    } else if (status === 'INACTIVE') {
      return 'unqualified';
    } else if (status === 'PROSPECT') {
      return 'renewal';
    } else {
      return 'new';
    }
  }

  changePage(event: any) {
    this.search(false, event.page, event.rows);
  }

  private formBuild(): any {
    this.formFilter = this.formBuilder.group({
      countryId: [
        null,
        []
      ],
      code: [
        null,
        []
      ],
      name: [
        null,
        []
      ],
      cityId: [
        null,
        []
      ],
      notes: [
        null,
        []
      ],
      status: [
        null,
        []
      ],
      shortBy: [
        null,
        []
      ],
      shortOrder: [
        null,
        []
      ]
    });
  }
}
