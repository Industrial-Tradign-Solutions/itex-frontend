import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Validators } from '@angular/forms';
import { Messages, TitlesMessages } from '@config/messages';
import { CommonPageTab } from '@config/tabs/commonPageTab';
import { TypeTab } from '@config/types/tabs';
import { BasicUser, UserInfo } from '@interfaces/administration/user';
import { BasicCity } from '@interfaces/masters/locations/cities';
import { MessageResponse } from '@interfaces/message-response';
import { ClientBasic, ClientContact, ClientInfoDep } from '@interfaces/partners/clients';
import {
  Invoice,
  invoiceTabName,
  ListInvoice,
  mapToInvoiceCreateRequest,
  mapToInvoiceUpdateRequest
} from '@interfaces/sales/invoice';
import { StaticListItem } from '@interfaces/static-list.model';
import { InvoicePermissions } from '@pages/principal/sales/invoices/invoices.component';
import { UsersService } from '@services/admin';
import { CityService } from '@services/masters';
import { ClientsService } from '@services/partners';
import { InvoiceService } from '@services/sales';
import { StorageService } from '@services/util';
import { AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { Observable } from 'rxjs';
import { constants, storageKeys } from '../../../../../environments';

const MESSAGES = Messages.pages.sales.invoice;
const TITLES   = TitlesMessages;

// Assigned by the server (consecutives, lifecycle, derived amounts) or fixed by
// the only department that exists. Never editable, in any mode.
const READ_ONLY_FIELDS = [
  'status',
  'clientAddress',
  'totalAmount',
  'paidAmount',
  'balanceDue'
];

// §9: create does not accept the ship-to block — the backend copies it from the
// client. §10 turns the six of them into mandatory fields of the update.
const SHIP_TO_FIELDS = [
  'shipToName',
  'shipToAddress',
  'shipToCityId',
  'shipToPhone',
  'shipToContactName',
  'shipToEmail'
];

@Component({
  selector: 'app-form-invoice',
  templateUrl: './form-invoice.component.html',
  styleUrl: './form-invoice.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormInvoiceComponent extends CommonPageTab<ListInvoice, InvoicePermissions, Invoice> implements OnInit {

  private invoiceSV = inject(InvoiceService);
  private clientSV  = inject(ClientsService);
  private citySV    = inject(CityService);
  private userSV    = inject(UsersService);
  private storageSV = inject(StorageService);

  // `tabItem.type` is a plain property that the base class mutates (onInitAction
  // downgrades it to 'view' when the update permission is missing or the lock
  // belongs to someone else). A plain property never marks an OnPush component
  // dirty, so the mode is mirrored here and refreshed from enableForm(), which
  // always runs after those mutations.
  mode     = signal<TypeTab>('create');
  isCreate = computed<boolean>(() => this.mode() === 'create');

  // Only DRAFT accepts a PUT (§10.3). ISSUED/PARTIAL_PAID can be locked but not
  // edited, so the whole form goes read-only instead of failing on submit.
  isDraft = computed<boolean>(() => (this.item()?.status ?? 'DRAFT') === 'DRAFT');
  canEdit = computed<boolean>(() => this.mode() !== 'view' && this.isValidOpen() && this.isDraft());

  listCurrency      = computed<StaticListItem[]>(() => this.staticListSV.getListCurrency());
  listIncoterms     = computed<StaticListItem[]>(() => this.staticListSV.getListIncoterms());
  listPaymentTerms  = computed<StaticListItem[]>(() => this.staticListSV.getListPaymentTerms());
  listVia           = computed<StaticListItem[]>(() => this.staticListSV.getListInvoiceVia());
  listInvoiceStatus = computed<StaticListItem[]>(() => this.staticListSV.getListInvoiceStatus());

  // Pure computed: QR/PO push the invoice's own sales rep into the array held by
  // the signal, which keeps the same reference and notifies nobody.
  listEmployees = computed<BasicUser[]>(() => {
    const employees = this.userSV.listEmployees();
    const salesRep  = this.item()?.salesRep;
    return salesRep && !employees.some(employee => employee.id === salesRep.id)
      ? [salesRep, ...employees]
      : employees;
  });

  private _listClientContact = signal<ClientContact[]>([]);
  listClientContact = computed<ClientContact[]>(() => this._listClientContact());

  // Kept apart from the form because "Copy from client" needs the client record,
  // not just the id held by the control.
  private _selectedClient = signal<ClientBasic | undefined>(undefined);

  private userData = computed<UserInfo | null>(() => this.storageSV.getPlain<UserInfo>(storageKeys.user_data.info));

  constructor() {
    super(MESSAGES);
    this.userSV.loadEmployees(false);
    this.clientSV.loadAllBasic();
    this.citySV.loadCities();
  }

  ngOnInit(): void {
    // `openAndLock` is a cold observable and the base skips it entirely when the
    // type is 'create' — the invoice is born locked by its creator (§9), so
    // there is nothing to lock from here.
    this.onInitAction({
      updatePermission: this.permissions().updateInvoice,
      openAndLock: this.invoiceSV.openAndLockInvoice(this.tabItem.item.id, this.tabItem.type),
      module: 'INV'
    });
  }

  invoiceCurrency(): string {
    return this.formTab?.get('currency')?.value ?? 'USD';
  }

  get filteredClients(): ClientBasic[] {
    return this.clientSV.filteredList;
  }

  get filteredCities(): BasicCity[] {
    return this.citySV.filteredCities;
  }

  searchClient(event: AutoCompleteCompleteEvent): void {
    this.clientSV.searchAutoComplete(event);
  }

  searchCity(event: AutoCompleteCompleteEvent): void {
    this.citySV.searchAutoComplete(event);
  }

  // §10.6: changing the client re-derives its data server-side, but the ship-to
  // block still travels from the request (§10.7) — so the user is warned instead
  // of having the block silently rewritten.
  changeClient(event: AutoCompleteSelectEvent): void {
    const client   = event.value as ClientBasic;
    const previous = this._selectedClient();

    if (this.isCreate() || !previous || previous.id === client.id) {
      this.applyClient(client);
      return;
    }

    this.utilSV.confirm({
      message: MESSAGES.changeClient(client.name),
      header: TITLES.confirmation,
      accept: () => this.applyClient(client),
      reject: () => this.formTab.patchValue({ clientId: previous.id })
    });
  }

  clearClient(): void {
    this._selectedClient.set(undefined);
    this._listClientContact.set([]);
    this.formTab.patchValue({ clientContactId: null, clientAddress: null });
    this.formTab.controls['clientContactId'].disable();
  }

  // Fills what the loaded catalogs actually hold: name/address come from the
  // client, contact/phone/email from the selected contact. The city is left
  // untouched — ClientBasic does not carry it.
  copyShipToFromClient(): void {
    const client  = this._selectedClient();
    const contact = this._listClientContact().find(item => item.id === this.formTab.get('clientContactId')?.value);
    const current = this.formTab.getRawValue();

    this.formTab.patchValue({
      shipToName: client?.name ?? current.shipToName,
      shipToAddress: client?.address ?? current.shipToAddress,
      shipToContactName: contact?.name ?? current.shipToContactName,
      shipToEmail: contact?.email ?? current.shipToEmail,
      shipToPhone: contact?.mainPhone ?? current.shipToPhone
    });
    this.formTab.markAsDirty();
    this.tabItem.pristine = false;
  }

  protected override getRequest() {
    return mapToInvoiceUpdateRequest(this.formTab.getRawValue());
  }

  protected override buildFormAction(): void {
    const invoice = this.item();

    // Numbering and department are not in the form: they are server-assigned and
    // never rendered — the tab header already shows the number.
    this.formTab = this.formBuilder.group({
      status: [invoice?.status ?? 'DRAFT', [Validators.required]],

      clientId: [invoice?.client?.id ?? null, [Validators.required]],
      clientContactId: [invoice?.clientContact?.id ?? null],
      clientAddress: [invoice?.client?.address ?? null],

      currency: [invoice?.currency ?? 'USD', [Validators.required]],
      incoterms: [invoice?.incoterms ?? null, [Validators.required]],
      via: [invoice?.via ?? null],
      paymentTerms: [invoice?.paymentTerms ?? null],
      salesRepId: [invoice?.salesRep?.id ?? this.userData()?.id ?? null],
      orderNumber: [invoice?.orderNumber ?? null],
      awbBl: [invoice?.awbBl ?? null],
      packingList: [invoice?.packingList ?? null],

      shipToName: [invoice?.shipToName ?? null],
      shipToAddress: [invoice?.shipToAddress ?? null],
      shipToCityId: [invoice?.shipToCity?.id ?? null],
      shipToPhone: [invoice?.shipToPhone ?? null],
      shipToContactName: [invoice?.shipToContactName ?? null],
      shipToEmail: [invoice?.shipToEmail ?? null],

      remarks: [invoice?.remarks ?? null],
      internalRemarks: [invoice?.internalRemarks ?? null],

      totalAmount: [invoice?.totalAmount ?? 0],
      paidAmount: [invoice?.paidAmount ?? 0],
      balanceDue: [invoice?.balanceDue ?? 0]
    });
  }

  protected override enableForm(): void {
    this.mode.set(this.tabItem.type);

    const invoice  = this.item();

    // The base class assigns `resp.data.name`, which carries no leading zeros.
    // Runs here because enableForm() is the last step of buildForm(), after both
    // onInitAction and onSubmitAction have written the name.
    if (invoice) {
      this.tabItem.item.draftNumber = invoice.draftNumber;
      this.tabItem.item.number      = invoice.number;
      this.tabItem.item.name        = invoiceTabName(invoice, this.tabItem.item.name);
    }

    const controls = this.formTab.controls;
    const perms    = this.permissions();
    const isCreate = this.isCreate();

    this.formTab.enable({ emitEvent: false });
    READ_ONLY_FIELDS.forEach(field => controls[field].disable({ emitEvent: false }));

    // Ship-to only exists once the draft does; on create the server fills it.
    SHIP_TO_FIELDS.forEach(field => {
      const control = controls[field];
      const required = field === 'shipToEmail'
        ? [Validators.required, Validators.email]
        : [Validators.required];

      control.setValidators(isCreate ? [] : required);
      control.updateValueAndValidity({ emitEvent: false });
      if (isCreate) {
        control.disable({ emitEvent: false });
      }
    });

    // §9 assigns both from the client / the authenticated user; §10 gates them
    // behind their own actions. Disabled they still travel via getRawValue(),
    // which is what the backend expects as a no-op echo.
    if (isCreate || !perms.editPaymentTermsInvoice) {
      controls['paymentTerms'].disable({ emitEvent: false });
    }
    if (isCreate || !perms.changeSalesRepInvoice) {
      controls['salesRepId'].disable({ emitEvent: false });
    }

    if (!controls['clientId'].value) {
      controls['clientContactId'].disable({ emitEvent: false });
    }

    if (!this.canEdit()) {
      this.formTab.disable({ emitEvent: false });
    }

    this.showForm = true;

    // Populate suggestions from the master lists first, then overlay the
    // invoice's own client/city records — the master load is async and can
    // still be in flight when this runs, so the overlay is what guarantees
    // the id resolves to a name instead of showing the raw uuid.
    this.searchClient({ query: '', originalEvent: new Event('') });
    this.searchCity({ query: '', originalEvent: new Event('') });
    this.syncClient(invoice);
    this.syncCity(invoice);
  }

  override onSubmit(): void {
    if (this.tabItem.pristine || this.tabItem.type === 'view') return;
    this.onSubmitAction({
      updatePermission: this.permissions().updateInvoice,
      action: this.getSubmitAction()
    });
  }

  private getSubmitAction(): Observable<MessageResponse<Invoice>> {
    const raw = this.formTab.getRawValue();

    if (this.tabItem.type === 'create') {
      return this.invoiceSV.createInvoice(mapToInvoiceCreateRequest(raw));
    }
    if (this.tabItem.type === 'edit') {
      return this.invoiceSV.updateInvoice(this.tabItem.item.id, this.getRequest());
    }
    throw new Error('Invalid tab type for submit');
  }

  private applyClient(client: ClientBasic): void {
    this._selectedClient.set(client);
    this.formTab.controls['clientContactId'].enable();
    this.formTab.patchValue({
      clientId: client.id,
      clientContactId: null,
      clientAddress: client.address
    });
    this.assignListClientContact(client.infoByDepartment);
  }

  // Keeps the autocomplete showing a name instead of a raw uuid when the invoice
  // is opened: the control holds the id and needs its record in the suggestions.
  private syncClient(invoice?: Invoice): void {
    if (!invoice?.client) return;

    const client: ClientBasic = {
      id: invoice.client.id,
      name: invoice.client.name,
      code: invoice.client.code,
      address: invoice.client.address,
      showName: `${invoice.client.code} - ${invoice.client.name}`,
      paymentTerms: invoice.client.paymentTerms,
      infoByDepartment: invoice.client.infoByDepartment
    };

    this._selectedClient.set(client);
    if (!this.clientSV.filteredList.some(item => item.id === client.id)) {
      this.clientSV.filteredList = [client, ...this.clientSV.filteredList];
    }
    this.assignListClientContact(invoice.client.infoByDepartment, invoice.clientContact?.id);
  }

  // Same problem as syncClient(), for the ship-to city: invoice.shipToCity only
  // carries id/name, so fullName falls back to name. Done synchronously (no
  // loadCities round trip) because that HTTP response can land after this
  // component's own render pass, leaving the city out of filteredCities with
  // nothing left to trigger a re-render afterwards.
  private syncCity(invoice?: Invoice): void {
    if (!invoice?.shipToCity) return;
    if (this.citySV.filteredCities.some(item => item.id === invoice.shipToCity.id)) return;

    const city: BasicCity = {
      id: invoice.shipToCity.id,
      name: invoice.shipToCity.name,
      fullName: invoice.shipToCity.name,
      state: undefined as unknown as BasicCity['state']
    };

    this.citySV.filteredCities = [city, ...this.citySV.filteredCities];
  }

  // Inactive contacts are dropped instead of being relabelled "(DISABLED)" as in
  // QR/PO — that suffix ends up copied verbatim into shipToContactName. The one
  // already stored on the invoice is kept so the dropdown can still show it.
  private assignListClientContact(infoByDepartment: ClientInfoDep[], keepContactId?: string): void {
    const contacts = (infoByDepartment ?? [])
      .filter(department => department.department.id === constants.ip_department_id)
      .flatMap(department => department.listContacts ?? [])
      .filter(contact => contact.active || contact.id === keepContactId);

    this._listClientContact.set(contacts);
  }

}
