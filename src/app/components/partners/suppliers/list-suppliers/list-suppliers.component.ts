import { Component, computed, inject } from '@angular/core';
import { ListSuppliers, SupplierFilter } from '@interfaces/partners/suppliers';
import { StaticListItem } from '@interfaces/static-list.model';
import { SupplierPermissions } from '@pages/principal/partners/suppliers/suppliers.component';
import { CityService, CountriesService } from '@services/masters';
import { SuppliersService } from '@services/partners';
import { SortEvent } from 'primeng/api';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { CommonListTab } from '@config/tabs/commonListTab';

@Component({
  selector: 'app-list-suppliers',
  templateUrl: './list-suppliers.component.html',
  styleUrl: './list-suppliers.component.scss'
})
export class ListSuppliersComponent extends CommonListTab<ListSuppliers, SupplierPermissions> {

  //! Inyecciones
  private citiesSV      = inject(CityService);
  private countriesSV   = inject(CountriesService);
  private suppliersSV   = inject(SuppliersService);
  //! ----------------------------------------------------------
  //* Señales
  listSupplierStatus = computed<StaticListItem[]>(() => this.staticListSV.getListSupplierStatus());
  //* -----------------------------------------------------------

  //? Variables
  oldKeyAutoCompleteCity: string = '';
  //?------------------------------------------------------------

  constructor() {
    super();
    this.loadCountries();
    this.loadCities();
    this.formBuild()
  }

  searchByCity(event: KeyboardEvent) {
    this.searchBy(event, this.oldKeyAutoCompleteCity, this.search.bind(this));
  }

  customSort(event: SortEvent) {
    this.sort(event, this.search.bind(this));
  }

  newSupplier() {
    this.new({
      id: '',
      name: 'New Supplier'
    });
  }

  search(resetPaginator: boolean, page: number = 0, size: number = 10) {
    if(resetPaginator && this.page().content.length > 0 && this.page().page.totalPages > 1) {
      this.paginator.changePage(0);
    }
    const filters: SupplierFilter = this.formFilter?.value;
    if (filters.cityId) {
      if (!this.utilSV.validateUUID(filters.cityId)) {
        filters.cityId = undefined;
      }
    }
    this.disableShort = true;
    this.searchAction(this.suppliersSV.listAllSuppliersPage(filters, page, size));
  }


  searchCity(event: AutoCompleteCompleteEvent) {
    this.citiesSV.searchAutoComplete(event);
  }

  loadCities() {
    this.citiesSV.loadCities();
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

  getStatusColor(status: 'ACTIVE' | 'INACTIVE'): string {
    if (status === 'ACTIVE') {
      return 'qualified';
    } else if (status === 'INACTIVE') {
      return 'unqualified';
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
