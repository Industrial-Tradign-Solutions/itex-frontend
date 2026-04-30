import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonListTab } from '@config/tabs/commonListTab';
import { TypeTab } from '@config/types/tabs';
import { BasicUser, UserInfo } from '@interfaces/administration/user';
import { IpQuoteRequestFilter, ListIpQuoteRequest } from '@interfaces/ip/quoteRequest';
import { StaticListItem } from '@interfaces/static-list.model';
import { IpQuoteRequestPermissions } from '@pages/principal/ip/quote-request/quote-request.component';
import { IpQuoteRequestService } from '@services/ip';
import { StorageService } from '@services/util';
import { SortEvent } from 'primeng/api';
import { Table } from 'primeng/table';
import { storageKeys } from '../../../../../environments';
import { UsersService } from '@services/admin';
import { ClientBasic } from '@interfaces/partners/clients';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { ClientsService, SuppliersService } from '@services/partners';
import { SupplierBasic } from '@interfaces/partners/suppliers';
import { environment } from '../../../../../environments/environment';

const TIMEOUT = environment.timeout;

@Component({
  selector: 'app-list-ip-quote-request',
  templateUrl: './list-ip-quote-request.component.html',
  styleUrl: './list-ip-quote-request.component.scss'
})
export class ListIpQuoteRequestComponent extends CommonListTab<ListIpQuoteRequest, IpQuoteRequestPermissions> implements OnInit{

  //! Inyecciones___________________________________
  private ipQuoteRequestSV   = inject(IpQuoteRequestService);
  private storageSV          = inject(StorageService);
  private userSV             = inject(UsersService);
  private clientSV           = inject(ClientsService);
  private supplierSV         = inject(SuppliersService);
  //! ----------------------------------------------

  //* Señales
  listIpQuoteRequestStatus = computed<StaticListItem[]>(() => this.staticListSV.getListIpQuoteRequestStatus());
  private userData = computed<UserInfo | null>(() => this.storageSV.getPlain<UserInfo>(storageKeys.user_data.info))
  private _listEmployees = signal<BasicUser[]>([]);
  listEmployees = computed<BasicUser[]>(() => this._listEmployees());
  //* -----------------------------------------------------------

  //? Variables
  oldKeyAutoCompleteClient: string = '';
  oldKeyAutoCompleteSupplier: string = '';

  showFilters: boolean = false;
  //?------------------------------------------------------------

  constructor() {
    super();
    this.userSV.loadEmployees(true);
    this.supplierSV.loadAllBasic();
    this.clientSV.loadAllBasic();
    this.formBuild();
  }

  ngOnInit(): void {
    this._listEmployees.set(this.userSV.listEmployees());

    this.formFilter.patchValue({
      date: 'DAY',
      salesRepId: this.userData()?.id,
      status: 'CREATED'
    });
    setTimeout(() => {
      this.search(true);
    }, 100);
  }

  customSort(event: SortEvent) {
    this.sort(event, this.search.bind(this));
  }

  search(resetPaginator: boolean, page: number = 0, size: number = (this.showFilters ? 9 : 10)) {
    if(resetPaginator && this.page().content.length > 0 && this.page().page.totalPages > 1) {
      this.paginator.changePage(0);
    }
    const filters: IpQuoteRequestFilter = this.formFilter?.value;
    if (filters.salesRepId) {
      if (!this.utilSV.validateUUID(filters.salesRepId)) {
        filters.salesRepId = undefined;
      }
    }
    if (filters.supplierId) {
      if (!this.utilSV.validateUUID(filters.supplierId)) {
        filters.supplierId = undefined;
      }
    }
    if (filters.clientId) {
      if (!this.utilSV.validateUUID(filters.clientId)) {
        filters.clientId = undefined;
      }
    }
    this.disableShort = true;
    this.searchAction(this.ipQuoteRequestSV.listAllQuoteRequestsPage(filters, page, size));
  }

  newQuoteRequest() {
    this.new({
      id: '',
      name: 'New QR'
    });
  }

  openQuoteRequest(quoteRequest: ListIpQuoteRequest, type: TypeTab) {
    this.open({item: quoteRequest, type, pristine: true});
  }

  getStatusColor(status: 'CREATED' | 'SENT' | 'REJECTED' | 'ANSWERED' | 'COMPLETE'): string {
    if (status === 'CREATED') {
      return 'new';
    } else if (status === 'REJECTED') {
      return 'unqualified';
    } else if (status === 'SENT') {
      return 'renewal';
    } else if (status === 'ANSWERED') {
      return 'negotiation';
    } else if (status === 'COMPLETE') {
      return 'qualified';
    } else {
      return 'new';
    }
  }

  override resetForm(dt: Table): void {
    this.formBuild();
    dt.reset();
    this.changeDateRank();
  }

  changePage(event: any) {
    this.search(false, event.page, event.rows);
  }

  private formBuild(): any {
    this.formFilter = this.formBuilder.group({
      id: [
        new Date().getTime().toString()
      ],
      number: [
        null
      ],
      status: [
        null
      ],
      clientCode: [
        null
      ],
      clientId: [
        null
      ],
      supplierId: [
        null
      ],
      remarks: [
        null
      ],
      salesRepId: [
        null
      ],
      clientRef: [
        null
      ],
      supplierRef: [
        null
      ],
      productDescription: [
        null
      ],
      date: [
        'ALL'
      ],
      initDate: [
        null
      ],
      endDate: [
        null
      ],
      shortBy: [
        'createdAt'
      ],
      shortOrder: [
        0
      ]
    });
    this.formFilter.controls['initDate'].disable();
    this.formFilter.controls['endDate'].disable();
  }

  changeDateRank(): void {
    if (this.formFilter.value.date !== 'ALL') {
      this.formFilter.controls['initDate'].disable();
      this.formFilter.controls['endDate'].disable();
      this.formFilter.patchValue({
        initDate: null,
        endDate: null
      });
    } else {
      this.formFilter.controls['initDate'].enable();
      this.formFilter.controls['endDate'].enable();
    }
  }

  searchByClient(event: KeyboardEvent) {
    if (event.key === 'Enter' && this.oldKeyAutoCompleteClient === 'Enter') {
      this.search(true);
      event.preventDefault();
    } else {
      this.oldKeyAutoCompleteClient = event.key;
    }
  }

  searchBySupplier(event: KeyboardEvent) {
    if (event.key === 'Enter' && this.oldKeyAutoCompleteSupplier === 'Enter') {
      this.search(true);
      event.preventDefault();
    } else {
      this.oldKeyAutoCompleteSupplier = event.key;
    }
  }

  get filteredClients(): ClientBasic[] {
    return this.clientSV.filteredList;
  }

  searchClient(event: AutoCompleteCompleteEvent) {
    this.clientSV.searchAutoComplete(event);
  }

  get filteredSupplier(): SupplierBasic[] {
    return this.supplierSV.filteredList;
  }

  searchSupplier(event: AutoCompleteCompleteEvent) {
    this.supplierSV.searchAutoComplete(event);
  }

  override closeLoading() {
    setTimeout(() => {
      this.setLoading(false);
      this.formFilter?.enable();
      this.changeDateRank();
      setTimeout(() => {
        this.disableShort = false;
      }, 100);
    }, TIMEOUT );
  }

}
