import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonListTab } from '@config/tabs/commonListTab';
import { BasicUser, UserInfo } from '@interfaces/administration/user';
import { IpQuotationFilter, ListIpQuotation } from '@interfaces/ip/quotation';
import { StaticListItem } from '@interfaces/static-list.model';
import { IpQuotationPermissions } from '@pages/principal/ip/quotations/quotations.component';
import { UsersService } from '@services/admin';
import { IpQuotationService } from '@services/ip';
import { ClientsService } from '@services/partners';
import { StorageService } from '@services/util';
import { storageKeys } from '../../../../../environments';
import { SortEvent } from 'primeng/api';
import { TypeTab } from '@config/types/tabs';
import { Table } from 'primeng/table';
import { ClientBasic } from '@interfaces/partners/clients';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { environment } from '../../../../../environments/environment';
import { NewQuotationModalComponent } from '@modals/ip/quotation/new-quotation-modal/new-quotation-modal.component';
import { DialogService } from 'primeng/dynamicdialog';

const TIMEOUT = environment.timeout;

@Component({
  selector: 'app-list-ip-quotation',
  templateUrl: './list-ip-quotation.component.html',
  styles: []
})
export class ListIpQuotationComponent extends CommonListTab<ListIpQuotation, IpQuotationPermissions> implements OnInit {

  //! Inyecciones___________________________________
  private ipQuotationSV      = inject(IpQuotationService);
  private storageSV          = inject(StorageService);
  private userSV             = inject(UsersService);
  private clientSV           = inject(ClientsService);
  private dialogSV           = inject(DialogService);
  //! ----------------------------------------------

  //* Señales
  listIpQuotationStatus = computed<StaticListItem[]>(() => this.staticListSV.getListIpQuotationStatus());
  private userData = computed<UserInfo | null>(() => this.storageSV.getPlain<UserInfo>(storageKeys.user_data.info))
  private _listEmployees = signal<BasicUser[]>([]);
  listEmployees = computed<BasicUser[]>(() => this._listEmployees());
  //* -----------------------------------------------------------

  //? Variables
  oldKeyAutoCompleteClient: string = '';
  showFilters: boolean = false;
  //?------------------------------------------------------------

  constructor() {
    super();
    this.userSV.loadEmployees(true);
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
    //TODO: Eliminar funcion
    setTimeout(() => {
      this.openQuotation({
        id: '4ab8294f-84cf-4a27-8358-6fa9f0e61037',
        name: 'GAG260201Q'
      }, 'edit');
    }, TIMEOUT);
    //TODO: Fin Eliminar
  }

  customSort(event: SortEvent) {
    this.sort(event, this.search.bind(this));
  }

  search(resetPaginator: boolean, page: number = 0, size: number = (this.showFilters ? 9 : 10)) {
    if(resetPaginator && this.page().content.length > 0 && this.page().page.totalPages > 1) {
      this.paginator.changePage(0);
    }
    const filters: IpQuotationFilter = this.formFilter?.value;
    if (filters.salesRepId) {
      if (!this.utilSV.validateUUID(filters.salesRepId)) {
        filters.salesRepId = undefined;
      }
    }
    if (filters.clientId) {
      if (!this.utilSV.validateUUID(filters.clientId)) {
        filters.clientId = undefined;
      }
    }
    this.disableShort = true;
    this.searchAction(this.ipQuotationSV.listAllQuotationsPage(filters, page, size));
  }

  newQuotation() {
    let modal = this.dialogSV.open(NewQuotationModalComponent, {
      header: 'CREATE QUOTATION',
      width: '60rem',
      closable: false,
      closeOnEscape: false
    });
    modal.onClose.subscribe({
      next: (resp: any) => {
        if (resp && resp.valid && resp.data) {
          this.open(resp.data);
          this.search(true);
        }
      }
    });
  }

  openQuotation(quotation: ListIpQuotation, type: TypeTab) {
    this.open({item: quotation, type, pristine: true});
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
      remarks: [
        null
      ],
      salesRepId: [
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

  get filteredClients(): ClientBasic[] {
    return this.clientSV.filteredList;
  }

  searchClient(event: AutoCompleteCompleteEvent) {
    this.clientSV.searchAutoComplete(event);
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
