import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { filtersPanel, rowEnter, rowEnterParams, stateCross } from '@config/animations/invoice.animations';
import { TypeTab } from '@config/types/tabs';
import { BasicUser, UserInfo } from '@interfaces/administration/user';
import { ClientBasic } from '@interfaces/partners/clients';
import { InvoiceFilter, InvoiceFilterDate, InvoiceStatus, ListInvoice } from '@interfaces/sales/invoice';
import { StaticListItem } from '@interfaces/static-list.model';
import { InvoicePermissions } from '@pages/principal/sales/invoices/invoices.component';
import { UsersService } from '@services/admin';
import { ClientsService } from '@services/partners';
import { InvoiceService } from '@services/sales';
import { StorageService } from '@services/util';
import { SortEvent } from 'primeng/api';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { Table } from 'primeng/table';
import { storageKeys } from '../../../../../environments';
import { CommonListTab } from '@config/tabs/commonListTab';

// Slugs of the global badge stylesheet (assets/demo/styles/badges.scss).
const STATUS_BADGE: Record<InvoiceStatus, string> = {
  DRAFT: 'new',
  ISSUED: 'renewal',
  PARTIAL_PAID: 'negotiation',
  PAID: 'qualified',
  CANCELLED: 'unqualified'
};

const DEFAULT_FILTER: InvoiceFilter = {
  date: 'MONTH',
  shortBy: 'createdAt',
  shortOrder: 0
};

const DEFAULT_PAGE_SIZE = 10;

@Component({
  selector: 'app-list-invoice',
  templateUrl: './list-invoice.component.html',
  styleUrl: './list-invoice.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [filtersPanel, rowEnter, stateCross]
})
export class ListInvoiceComponent extends CommonListTab<ListInvoice, InvoicePermissions> implements OnInit {

  private invoiceSV = inject(InvoiceService);
  private storageSV = inject(StorageService);
  private userSV    = inject(UsersService);
  private clientSV  = inject(ClientsService);

  readonly rowEnterParams   = rowEnterParams;
  readonly skeletonRows     = [1, 2, 3, 4, 5];
  readonly skeletonCells    = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Whole filter state lives in a single signal — no FormGroup, so the bar is
  // never disabled/re-enabled while a search is in flight.
  private _filter = signal<InvoiceFilter>({ ...DEFAULT_FILTER });
  filter = computed<InvoiceFilter>(() => this._filter());

  // The backend only honours initDate/endDate while the quick filter is `ALL`.
  isCustomRange = computed<boolean>(() => this._filter().date === 'ALL');
  showFilters   = signal<boolean>(false);
  pageSize      = signal<number>(DEFAULT_PAGE_SIZE);

  statusList    = computed<StaticListItem[]>(() => this.staticListSV.getListInvoiceStatus());
  listEmployees = computed<BasicUser[]>(() => this.userSV.listEmployees());

  private userData = computed<UserInfo | null>(() => this.storageSV.getPlain<UserInfo>(storageKeys.user_data.info));

  private rewindingPaginator = false;

  constructor() {
    super();
    this.userSV.loadEmployees(true);
    this.clientSV.loadAllBasic();
  }

  ngOnInit(): void {
    this.patch({ salesRepId: this.userData()?.id });
    this.search(true);
  }

  patch(partial: Partial<InvoiceFilter>): void {
    this._filter.update(filter => ({ ...filter, ...partial }));
  }

  // Changing a filter never triggers a request on its own: the search is only
  // launched by the Search button or by Enter. Leaving `ALL` drops any custom
  // range already typed, so the request never carries dates the backend ignores.
  changeDateRange(date: InvoiceFilterDate): void {
    this.patch(date === 'ALL'
      ? { date }
      : { date, initDate: undefined, endDate: undefined });
  }

  search(resetPaginator: boolean, page: number = 0, size: number = this.pageSize()): void {
    if (resetPaginator) {
      this.resetPaginator();
    }
    this.pageSize.set(size);
    this.disableShort = true;
    this.searchAction(this.invoiceSV.listAllInvoicesPage(this.sanitizedFilter(), page, size));
  }

  changePage(event: any): void {
    // Ignore the event emitted by our own programmatic rewind, otherwise every
    // filtered search would fire two requests (the paginator emits synchronously).
    if (this.rewindingPaginator) {
      return;
    }
    this.search(false, event.page, event.rows);
  }

  // `shortOrder` of the API is 0 = DESC / 1 = ASC, while PrimeNG emits 1 / -1.
  customSort(event: SortEvent): void {
    if (this.disableShort || this.page().content.length === 0 || !event.field) {
      return;
    }
    this.patch({ shortBy: event.field, shortOrder: event.order === 1 ? 1 : 0 });
    this.search(true);
  }

  openInvoice(invoice: ListInvoice, type: TypeTab): void {
    this.open({ item: invoice, type, pristine: true });
  }

  statusBadge(status: InvoiceStatus): string {
    return STATUS_BADGE[status] ?? 'new';
  }

  get filteredClients(): ClientBasic[] {
    return this.clientSV.filteredList;
  }

  searchClient(event: AutoCompleteCompleteEvent): void {
    this.clientSV.searchAutoComplete(event);
  }

  override resetForm(dt: Table): void {
    this._filter.set({ ...DEFAULT_FILTER });
    this.pageSize.set(DEFAULT_PAGE_SIZE);
    dt.reset();
  }

  // The base class disables the whole filter form while loading and delays the
  // release by `environment.timeout` (1s of artificial latency); INV keeps the
  // bar usable and flips the flag as soon as the response lands.
  protected override viewLoading(): void {
    this.setLoading(true);
  }

  protected override closeLoading(): void {
    this.setLoading(false);
    this.disableShort = false;
  }

  private resetPaginator(): void {
    if (!this.paginator || this.paginator.getPage() === 0) {
      return;
    }
    this.rewindingPaginator = true;
    this.paginator.changePage(0);
    this.rewindingPaginator = false;
  }

  private sanitizedFilter(): InvoiceFilter {
    const filter: InvoiceFilter = { ...this._filter() };

    // The autocomplete keeps free text until an option is picked.
    if (filter.clientId && !this.utilSV.validateUUID(filter.clientId)) {
      filter.clientId = undefined;
    }
    if (filter.salesRepId && !this.utilSV.validateUUID(filter.salesRepId)) {
      filter.salesRepId = undefined;
    }

    return filter;
  }

}
