import { ChangeDetectionStrategy, Component, computed, DestroyRef, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators } from '@angular/forms';
import { Messages, TitlesMessages } from '@config/messages';
import { CommonPageTab } from '@config/tabs/commonPageTab';
import { EmitedTab, TypeTab } from '@config/types/tabs';
import { BasicUser, UserInfo } from '@interfaces/administration/user';
import { BasicCity } from '@interfaces/masters/locations/cities';
import { MessageResponse } from '@interfaces/message-response';
import { ClientBasic, ClientContact, ClientInfoDep } from '@interfaces/partners/clients';
import {
  Invoice,
  InvoiceAssociatedPo,
  InvoiceCharge,
  InvoiceProduct,
  InvoiceStatus,
  InvoiceTax,
  invoiceStatusBadge,
  invoiceStatusLabel,
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
import { EmailService, NavigateTabsService, StorageService } from '@services/util';
import { AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { HistoryInvoiceModalComponent } from '@modals/sales/inv/history-invoice-modal/history-invoice-modal.component';
import { ImportProductsFromPoModalComponent } from '@modals/sales/inv/import-products-from-po-modal/import-products-from-po-modal.component';
import { InvoiceProductModalComponent } from '@modals/sales/inv/invoice-product-modal/invoice-product-modal.component';
import { InvoiceReasonModalComponent } from '@modals/sales/inv/invoice-reason-modal/invoice-reason-modal.component';
import { LinkPurchaseOrdersModalComponent } from '@modals/sales/inv/link-purchase-orders-modal/link-purchase-orders-modal.component';
import { ListInvoiceChargesModalComponent } from '@modals/sales/inv/list-invoice-charges-modal/list-invoice-charges-modal.component';
import { ListInvoicePaymentsModalComponent } from '@modals/sales/inv/list-invoice-payments-modal/list-invoice-payments-modal.component';
import { ListInvoiceTaxesModalComponent } from '@modals/sales/inv/list-invoice-taxes-modal/list-invoice-taxes-modal.component';
import { finalize, Observable, Subject } from 'rxjs';
import { constants, emailBodyTemplates, storageKeys } from '../../../../../environments';

const MESSAGES = Messages.pages.sales.invoice;
const TITLES   = TitlesMessages;

// Derived from the selected client, never typed. `status` and the amounts used
// to live here too; they are not form controls any more — the server owns them
// and they are rendered as text by the summary and totals sections.
const READ_ONLY_FIELDS = [
  'clientAddress'
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

// §10/§17: an ISSUED invoice still accepts the PUT, but only applies these
// five. Any real change to another header field is rejected by name
// (`sales.invoice.issued-restricted-field`), so the rest goes read-only instead
// of letting the user type into a control the server will refuse.
const ISSUED_EDITABLE_FIELDS = [
  'orderNumber',
  'awbBl',
  'packingList',
  'remarks',
  'internalRemarks'
];

// Q/QR/PO relabel the contact in place (`contact.name += ' (DISABLED)'`), which
// is why that suffix ends up copied into ship-to fields. The flag travels in its
// own property so `name` stays the value the backend gave.
export type InvoiceContactOption = ClientContact & { label: string };

@Component({
  selector: 'app-form-invoice',
  templateUrl: './form-invoice.component.html',
  styleUrl: './form-invoice.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormInvoiceComponent extends CommonPageTab<ListInvoice, InvoicePermissions, Invoice> implements OnInit {

  private invoiceSV  = inject(InvoiceService);
  private clientSV   = inject(ClientsService);
  private citySV     = inject(CityService);
  private userSV     = inject(UsersService);
  private storageSV  = inject(StorageService);
  private navigateSV = inject(NavigateTabsService);
  private emailSV    = inject(EmailService);
  private destroyRef = inject(DestroyRef);

  // The clone is a brand new invoice: it opens in its own tab instead of
  // replacing the current one, same as PO.
  @Output() opened = new EventEmitter<EmitedTab<ListInvoice>>();

  // `tabItem.type` is a plain property that the base class mutates (onInitAction
  // downgrades it to 'view' when the update permission is missing or the lock
  // belongs to someone else). A plain property never marks an OnPush component
  // dirty, so the mode is mirrored here and refreshed from enableForm(), which
  // always runs after those mutations.
  mode     = signal<TypeTab>('create');
  isCreate = computed<boolean>(() => this.mode() === 'create');

  // Only DRAFT accepts a PUT (§10.3). ISSUED/PARTIAL_PAID can be locked but not
  // edited, so the whole form goes read-only instead of failing on submit.
  invoiceStatus = computed<InvoiceStatus>(() => this.item()?.status ?? 'DRAFT');
  isDraft = computed<boolean>(() => this.invoiceStatus() === 'DRAFT');

  // Status badge displayed below the client section (matches list badge styling).
  statusBadge = computed<string>(() => invoiceStatusBadge(this.item()?.status ?? 'DRAFT'));
  statusLabel = computed<string>(() => invoiceStatusLabel(this.item()?.status ?? 'DRAFT'));

  // The tab is editable at all (not opened read-only, lock not taken by anyone
  // else). What is editable *within* it is decided by the status below.
  private lockHeld = computed<boolean>(() => this.mode() !== 'view' && this.isValidOpen());

  // Full edit: header, ship-to and every line item. Only DRAFT.
  canEdit = computed<boolean>(() => this.lockHeld() && this.isDraft());

  // Restricted edit: the five non-financial fields of an issued invoice. Line
  // items stay frozen — `total_amount` was snapshotted when it was issued.
  canEditRestricted = computed<boolean>(() => this.lockHeld() && this.invoiceStatus() === 'ISSUED');

  canSubmit = computed<boolean>(() => this.canEdit() || this.canEditRestricted());

  // One notice per state, so a locked form always explains itself instead of
  // repeating the same sentence in four different situations.
  editNotice = computed<{ severity: string, text: string } | null>(() => {
    if (this.isCreate() || this.isDraft()) return null;

    if (this.canEditRestricted()) {
      return {
        severity: 'info',
        text: 'This invoice is issued: only Order #, AWB / BL, Packing List and the remarks can be edited.'
      };
    }
    if (this.invoiceStatus() === 'CANCELLED') {
      return { severity: 'warn', text: 'This invoice is cancelled and kept for auditing only.' };
    }
    if (this.invoiceStatus() === 'ISSUED') {
      return { severity: 'info', text: 'Only draft invoices can be edited.' };
    }
    return {
      severity: 'info',
      text: 'This invoice has registered payments and is read-only. Void its payments to correct it.'
    };
  });

  // Every lifecycle endpoint (§15) asks for the same three things on top of its
  // own permission: a persisted invoice, opened in EDIT mode, with the lock
  // actually held by this user.
  private canTransition = computed<boolean>(() => !this.isCreate() && this.mode() === 'edit' && this.isValidOpen());

  // A live payment blocks revert and cancel (§15.2/§15.3). `paidAmount` already
  // excludes voided payments, so it is exactly "there is money on this invoice".
  private hasPayments = computed<boolean>(() => (this.item()?.paidAmount ?? 0) > 0);

  // Visible when the action exists for this user and this state; §15.1's data
  // preconditions (≥1 product, positive total) only disable it, so the tooltip
  // can say what is missing instead of the button vanishing.
  canIssue = computed<boolean>(() =>
    this.canTransition() && this.permissions().issueInvoice && this.isDraft()
  );

  issueReady = computed<boolean>(() =>
    this.listProducts().length > 0 && (this.item()?.totalAmount ?? 0) > 0
  );

  canRevert = computed<boolean>(() =>
    this.canTransition()
    && this.permissions().revertInvoiceToDraft
    && this.invoiceStatus() === 'ISSUED'
    && !this.hasPayments()
  );

  canCancel = computed<boolean>(() =>
    this.canTransition()
    && this.permissions().cancelInvoice
    && (this.isDraft() || this.invoiceStatus() === 'ISSUED')
    && !this.hasPayments()
  );

  canDelete = computed<boolean>(() =>
    this.canTransition() && this.permissions().deleteInvoice && this.isDraft()
  );

  // §15.4: once an invoice has an official number that number stays reserved
  // forever, so the draft it went back to can never be deleted — permission or
  // not. The button stays visible and disabled to explain why.
  deleteLocked = computed<boolean>(() => !!this.item()?.number);

  // Payments only exist from ISSUED onwards; a cancelled invoice never had any
  // (both cancel and revert are blocked once money is on it).
  showPayments = computed<boolean>(() =>
    !this.isCreate() && ['ISSUED', 'PARTIAL_PAID', 'PAID'].includes(this.invoiceStatus())
  );

  // §16.1 only accepts a payment on ISSUED/PARTIAL_PAID, and like every other
  // mutation it needs the lock held by this user.
  canRegisterPayment = computed<boolean>(() =>
    this.canTransition()
    && this.permissions().registerPaymentInvoice
    && ['ISSUED', 'PARTIAL_PAID'].includes(this.invoiceStatus())
  );

  // Voiding is also allowed on PAID — §17 made that status lockable precisely
  // because it is the only way to correct a settled invoice.
  canVoidPayment = computed<boolean>(() =>
    this.canTransition() && this.permissions().voidPaymentInvoice && this.showPayments()
  );

  canClone = computed<boolean>(() => !this.isCreate() && this.permissions().cloneInvoice);
  canViewHistory = computed<boolean>(() => !this.isCreate() && this.permissions().viewHistoryInvoice);

  // §18.1: printing is a read — it needs neither the lock nor ownership. It
  // does need products, without which the server cannot render the document.
  canPrint = computed<boolean>(() => !this.isCreate());
  printReady = computed<boolean>(() => this.listProducts().length > 0);

  // Module rule (§18.1): a draft can be printed but never emailed. A reverted
  // draft already carries a `number`, so the gate is the status, not the number.
  canSend = computed<boolean>(() =>
    !this.isCreate() && ['ISSUED', 'PARTIAL_PAID', 'PAID'].includes(this.invoiceStatus())
  );

  listCurrency     = computed<StaticListItem[]>(() => this.staticListSV.getListCurrency());
  listIncoterms    = computed<StaticListItem[]>(() => this.staticListSV.getListIncoterms());
  listPaymentTerms = computed<StaticListItem[]>(() => this.staticListSV.getListPaymentTerms());
  listVia          = computed<StaticListItem[]>(() => this.staticListSV.getListInvoiceVia());

  // Pure computed: QR/PO push the invoice's own sales rep into the array held by
  // the signal, which keeps the same reference and notifies nobody.
  listEmployees = computed<BasicUser[]>(() => {
    const employees = this.userSV.listEmployees();
    const salesRep  = this.item()?.salesRep;
    return salesRep && !employees.some(employee => employee.id === salesRep.id)
      ? [salesRep, ...employees]
      : employees;
  });

  private _listClientContact = signal<InvoiceContactOption[]>([]);
  listClientContact = computed<InvoiceContactOption[]>(() => this._listClientContact());

  // Only IP exists today; the gate is isolated here so a future department
  // (RM/IF/LO) only needs its own `@if` in the template, nothing else.
  department           = computed<string | undefined>(() => this.item()?.department);
  listProducts         = computed<InvoiceProduct[]>(() => this.item()?.products ?? []);
  listCharges          = computed<InvoiceCharge[]>(() => this.item()?.charges ?? []);
  listTaxes            = computed<InvoiceTax[]>(() => this.item()?.taxes ?? []);
  linkedPurchaseOrders = computed<InvoiceAssociatedPo[]>(() => this.item()?.linkedPurchaseOrders ?? []);
  canEditProducts      = computed<boolean>(() => this.canEdit());

  // Kept apart from the form because "Copy from client" needs the client record,
  // not just the id held by the control.
  private _selectedClient = signal<ClientBasic | undefined>(undefined);

  // Subject used to signal the Add Product modal to close so the Import from PO
  // modal can open in its place (two-level modal pattern, same as Q's charges).
  private _openImportFromPo$ = new Subject<void>();

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

  // Own state instead of reading clientSV/citySV.filteredList: those fields live
  // on root-provided singletons, shared by every open tab. With several tabs
  // mounted at once (Open All), each tab's enableForm() overwrote the others'
  // suggestions as it finished loading in the background.
  filteredClients: ClientBasic[] = [];
  filteredCities: BasicCity[] = [];

  searchClient(event: AutoCompleteCompleteEvent): void {
    this.filteredClients = this.clientSV.searchAutoComplete(event);
  }

  searchCity(event: AutoCompleteCompleteEvent): void {
    this.filteredCities = this.citySV.searchAutoComplete(event);
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

    // The autocomplete has already written the new clientId into the control, so
    // the previous client's contact is dropped now and not when the dialog is
    // answered: saving while it is still open would send a clientId and a
    // clientContactId belonging to two different clients, and the backend
    // resolves the contact against the client (§10.3, step 6).
    const previousContactId = this.formTab.get('clientContactId')?.value ?? null;
    this.applyClient(client);

    this.utilSV.confirm({
      message: MESSAGES.changeClient(client.name),
      header: TITLES.confirmation,
      accept: () => { },
      reject: () => this.applyClient(previous, previousContactId)
    });
  }

  clearClient(): void {
    this._selectedClient.set(undefined);
    this._listClientContact.set([]);
    this.formTab.patchValue({ clientId: null, clientContactId: null, clientAddress: null });
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

    // Numbering, department, status and the amounts are not in the form: they
    // are server-assigned and read-only, so they are rendered as text instead of
    // travelling as disabled controls nobody ever submits.
    this.formTab = this.formBuilder.group({
      clientId: [invoice?.client?.id ?? null, [Validators.required]],
      clientContactId: [invoice?.clientContact?.id ?? null, [Validators.required]],
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
      internalRemarks: [invoice?.internalRemarks ?? null]
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

    // Outside DRAFT the whole form goes down first and only the fields the
    // backend still applies come back up — the inverse (enabling one by one)
    // would silently leak any control added to the group later on.
    if (!this.canEdit()) {
      this.formTab.disable({ emitEvent: false });

      if (this.canEditRestricted()) {
        ISSUED_EDITABLE_FIELDS.forEach(field => controls[field].enable({ emitEvent: false }));
      }
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

  // The contact list is rebuilt before the control is patched: the dropdown has
  // to already hold the option, otherwise PrimeNG renders the raw uuid.
  private applyClient(client: ClientBasic, contactId: string | null = null): void {
    this._selectedClient.set(client);
    this.assignListClientContact(client.infoByDepartment);
    this.formTab.controls['clientContactId'].enable();
    this.formTab.patchValue({
      clientId: client.id,
      clientContactId: contactId,
      clientAddress: client.address
    });
  }

  // Keeps the autocomplete showing a name instead of a raw uuid when the invoice
  // is opened: the control holds the id and needs its record in the suggestions.
  //
  // `invoice.client` (from open-lock) is the light `InvoiceClientResponse` —
  // itex-invoices-api.md:1310 says it deliberately drops infoByDepartment to
  // avoid an N+1 over listContacts. The full record (with contacts) lives in
  // clientSV.list() instead, the same list-active catalog the autocomplete and
  // changeClient() already use, so it's resolved from there.
  private syncClient(invoice?: Invoice): void {
    if (!invoice?.client) return;

    const full = this.clientSV.list().find(item => item.id === invoice.client.id);

    const client: ClientBasic = full ?? {
      id: invoice.client.id,
      name: invoice.client.name,
      code: invoice.client.code,
      address: invoice.client.address,
      showName: `${invoice.client.code} - ${invoice.client.name}`,
      paymentTerms: invoice.client.paymentTerms,
      infoByDepartment: []
    };

    this._selectedClient.set(client);
    if (!this.filteredClients.some(item => item.id === client.id)) {
      this.filteredClients = [client, ...this.filteredClients];
    }
    this.assignListClientContact(client.infoByDepartment);
  }

  // Same problem as syncClient(), for the ship-to city: invoice.shipToCity only
  // carries id/name, so fullName falls back to name. Done synchronously (no
  // loadCities round trip) because that HTTP response can land after this
  // component's own render pass, leaving the city out of filteredCities with
  // nothing left to trigger a re-render afterwards.
  private syncCity(invoice?: Invoice): void {
    if (!invoice?.shipToCity) return;
    if (this.filteredCities.some(item => item.id === invoice.shipToCity.id)) return;

    const city: BasicCity = {
      id: invoice.shipToCity.id,
      name: invoice.shipToCity.name,
      fullName: invoice.shipToCity.name,
      state: undefined as unknown as BasicCity['state']
    };

    this.filteredCities = [city, ...this.filteredCities];
  }

  // Same criteria as Q/QR/PO: every contact of the IP department stays in the
  // list, the inactive ones only get flagged. Filtering them out left the
  // dropdown empty for clients whose contacts are not marked active, and hid the
  // contact an already-issued invoice points at.
  private assignListClientContact(infoByDepartment: ClientInfoDep[]): void {
    const contacts = (infoByDepartment ?? [])
      .filter(department => department.department.id === constants.ip_department_id)
      .flatMap(department => department.listContacts ?? [])
      .map(contact => ({
        ...contact,
        label: contact.active ? contact.name : `${contact.name} (DISABLED)`
      }));

    this._listClientContact.set(contacts);
  }

  //#region Lifecycle (§15) and document actions (§18)

  issueInvoice(): void {
    this.confirmTransition(MESSAGES.issue(this.invoiceNumber()), () => this.invoiceSV.issueInvoice(this.tabItem.item.id));
  }

  revertToDraft(): void {
    this.confirmTransition(MESSAGES.revert(this.invoiceNumber()), () => this.invoiceSV.revertInvoiceToDraft(this.tabItem.item.id));
  }

  cancelInvoice(): void {
    const modal = this.dialogSV.open(InvoiceReasonModalComponent, {
      header: `CANCEL INVOICE ${this.invoiceNumber()}`,
      width: '45rem',
      closable: false,
      closeOnEscape: false,
      data: {
        label: 'Cancel reason',
        message: MESSAGES.cancelWarning,
        confirmText: 'Cancel Invoice'
      }
    });

    modal.onClose.subscribe({
      next: (resp: { valid: boolean, reason: string }) => {
        if (!resp?.valid) return;

        this._loading.set(true);
        this.invoiceSV.cancelInvoice(this.tabItem.item.id, resp.reason)
          .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this._loading.set(false)))
          .subscribe({
            next: response => {
              this.utilSV.setMessage(response.title, response.message, 'success');
              this.closeTab();
            },
            error: err => this.utilSV.setMessage(TITLES.error, err?.errorMessage ?? err, 'error')
          });
      }
    });
  }

  deleteInvoice(): void {
    this.utilSV.confirm({
      message: MESSAGES.remove(this.invoiceNumber()),
      header: TITLES.confirmation,
      accept: () => {
        this._loading.set(true);
        this.invoiceSV.deleteInvoice(this.tabItem.item.id)
          .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this._loading.set(false)))
          .subscribe({
            next: resp => {
              this.utilSV.setMessage(resp.title, resp.message, 'success');
              this.closeTab();
            },
            error: err => this.utilSV.setMessage(TITLES.error, err?.errorMessage ?? err, 'error')
          });
      }
    });
  }

  cloneInvoice(): void {
    this.utilSV.confirm({
      message: MESSAGES.clone(this.invoiceNumber()),
      header: TITLES.confirmation,
      accept: () => {
        this._loading.set(true);
        this.invoiceSV.cloneInvoice(this.tabItem.item.id)
          .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this._loading.set(false)))
          .subscribe({
            next: resp => {
              this.utilSV.setMessage(resp.title, resp.message, 'success');
              // Copy instead of the row itself: the new tab renames its item and
              // that would otherwise rewrite the record we just received.
              this.opened.emit({
                item: { ...resp.data, name: invoiceTabName(resp.data) },
                type: this.permissions().updateInvoice ? 'edit' : 'view',
                pristine: true
              });
            },
            error: err => this.utilSV.setMessage(TITLES.error, err?.errorMessage ?? err, 'error')
          });
      }
    });
  }

  openHistory(): void {
    this.dialogSV.open(HistoryInvoiceModalComponent, {
      header: `HISTORY OF ${this.invoiceNumber()}`,
      width: '75rem',
      closable: true,
      closeOnEscape: true,
      data: { invoiceId: this.tabItem.item.id }
    });
  }

  printInvoice(): void {
    this.downloadFile(this.invoiceSV.printInvoice(this.tabItem.item.id), this.invoiceNumber());
  }

  // No dedicated endpoint, same as QR/Q/PO: the PDF is downloaded here and
  // re-sent through the generic mail endpoint from the shared modal.
  printAndSendInvoice(): void {
    const invoice = this.item();
    if (!invoice) return;

    this._loadingPrintAndSent.set(true);
    this.invoiceSV.printInvoice(invoice.id)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this._loadingPrintAndSent.set(false)))
      .subscribe({
        next: file => {
          const number    = this.invoiceNumber();
          const isSpanish = invoice.client?.language === 'SPANISH';

          this.emailSV.openModalEmail({
            tittle: `SEND INVOICE ${number}`,
            subjectTemplate: isSpanish ? `Factura ${number}` : `Invoice ${number}`,
            bodyTemplate: isSpanish
              ? emailBodyTemplates.invoice_es(invoice.clientContact?.name)
              : emailBodyTemplates.invoice_en(invoice.clientContact?.name),
            toTemplate: invoice.clientContact?.email ? [invoice.clientContact.email] : [],
            attachmentsTemplate: [{ name: `${number}.pdf`, data: file }]
          });
        },
        error: () => this.utilSV.setMessage(TITLES.error, 'Error printing the document', 'error')
      });
  }

  // Issue and revert answer with the whole detail, so the form is rebuilt from
  // the response rather than re-read: `status`, `number` and the four dates all
  // move at once, and the tab label depends on them.
  private confirmTransition(message: string, action: () => Observable<MessageResponse<Invoice>>): void {
    this.utilSV.confirm({
      message,
      header: TITLES.confirmation,
      accept: () => {
        this._loading.set(true);
        this.showForm = false;
        action()
          .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this._loading.set(false)))
          .subscribe({
            next: resp => {
              this.utilSV.setMessage(resp.title, resp.message, 'success');
              this._item.set(resp.data);
              this.rebuildForm();
            },
            error: err => {
              this.showForm = true;
              this.utilSV.setMessage(TITLES.error, err?.errorMessage ?? err, 'error');
            }
          });
      }
    });
  }

  // Cancel releases the lock server-side (§15.3) and delete removes the row
  // altogether, so in both cases the tab has to go without the page trying to
  // release a lock that is no longer there — hence the downgrade to 'view',
  // which is what `removeTab` checks before calling close.
  private closeTab(): void {
    this.tabItem.pristine = true;
    this.tabItem.type = 'view';
    this.onClose.emit({ index: this.index + 1 });
  }

  private invoiceNumber(): string {
    return invoiceTabName(this.item(), this.tabItem.item.name);
  }

  //#endregion

  //#region Products / Charges / Taxes / Purchase orders
  // Every sub-resource (§11-§14) is mutated from its own modal. None of those
  // endpoints answers with the invoice — they return the affected line — while
  // the server recalculates and persists the totals, so the only correct move
  // afterwards is to re-read the detail.

  viewProduct(product: InvoiceProduct): void {
    this.navigateSV.openModuleNewTabAndOpenItem('Products', product.ipProduct.id);
  }

  openProductModal(type: 'create' | 'edit', product?: InvoiceProduct): void {
    if (!this.canEditProducts()) return;

    // Reset the subject so a previous subscription does not fire.
    this._openImportFromPo$ = new Subject<void>();

    const modal = this.dialogSV.open(InvoiceProductModalComponent, {
      header: type === 'edit' ? 'UPDATE PRODUCT' : 'ADD PRODUCT',
      width: '70rem',
      closable: false,
      closeOnEscape: false,
      data: {
        type,
        product,
        invoiceId: this.tabItem.item.id,
        currency: this.invoiceCurrency(),
        openImportFromPo$: this._openImportFromPo$.asObservable()
      }
    });

    modal.onClose.subscribe({
      next: (resp: { valid: boolean; openImportFromPo?: boolean }) => {
        if (resp?.valid) {
          this.reloadInvoice();
        } else if (resp?.openImportFromPo) {
          this.openImportProductsModal();
        }
      }
    });
  }

  openImportProductsModal(): void {
    if (!this.canEditProducts()) return;

    const modal = this.dialogSV.open(ImportProductsFromPoModalComponent, {
      header: 'IMPORT PRODUCTS FROM PO',
      width: '90vw',
      closable: false,
      closeOnEscape: false,
      data: {
        invoiceId: this.tabItem.item.id,
        currency: this.invoiceCurrency()
      }
    });

    modal.onClose.subscribe({
      next: (resp: { valid: boolean }) => {
        if (resp?.valid) this.reloadInvoice();
      }
    });
  }

  removeProduct(product: InvoiceProduct): void {
    if (!this.canEditProducts()) return;

    this.utilSV.confirm({
      message: `Are you sure to remove the product ${product.ipProduct.description}?`,
      header: TITLES.confirmation,
      accept: () => {
        this.invoiceSV.removeInvoiceProduct(this.tabItem.item.id, product.id).subscribe({
          next: resp => {
            this.utilSV.setMessage(resp.title, resp.message, 'success');
            this.reloadInvoice();
          },
          error: err => this.utilSV.setMessage(TITLES.error, err?.errorMessage ?? err, 'error')
        });
      }
    });
  }

  openChargesModal(): void {
    const modal = this.dialogSV.open(ListInvoiceChargesModalComponent, {
      header: 'CHARGES',
      width: '60rem',
      closable: false,
      closeOnEscape: false,
      data: {
        invoiceId: this.tabItem.item.id,
        currency: this.invoiceCurrency(),
        canEdit: this.canEditProducts(),
        charges: this.listCharges(),
        purchaseOrders: this.linkedPurchaseOrders()
      }
    });

    modal.onClose.subscribe({
      next: (resp: { valid: boolean }) => {
        if (resp?.valid) this.reloadInvoice();
      }
    });
  }

  openTaxesModal(): void {
    const modal = this.dialogSV.open(ListInvoiceTaxesModalComponent, {
      header: 'TAXES',
      width: '60rem',
      closable: false,
      closeOnEscape: false,
      data: {
        invoiceId: this.tabItem.item.id,
        currency: this.invoiceCurrency(),
        canEdit: this.canEditProducts(),
        taxes: this.listTaxes(),
        productsTotal: this.item()?.productsTotal ?? 0
      }
    });

    modal.onClose.subscribe({
      next: (resp: { valid: boolean }) => {
        if (resp?.valid) this.reloadInvoice();
      }
    });
  }

  // Registering or voiding recalculates paidAmount, balanceDue and the status
  // in the same transaction, so the detail is re-read once the modal closes.
  openPaymentsModal(): void {
    const modal = this.dialogSV.open(ListInvoicePaymentsModalComponent, {
      header: 'PAYMENTS',
      width: '80rem',
      closable: false,
      closeOnEscape: false,
      data: {
        invoiceId: this.tabItem.item.id,
        currency: this.invoiceCurrency(),
        totalAmount: this.item()?.totalAmount ?? 0,
        canRegister: this.canRegisterPayment(),
        canVoid: this.canVoidPayment()
      }
    });

    modal.onClose.subscribe({
      next: (resp: { valid: boolean }) => {
        if (resp?.valid) this.reloadInvoice();
      }
    });
  }

  openPo(po: InvoiceAssociatedPo): void {
    this.navigateSV.openModuleNewTabAndOpenItem('Purchase_Orders', po.id);
  }

  openClonedInvoice(cloned: { id: string; number: string | null; draftNumber: string }): void {
    this.navigateSV.openModuleNewTabAndOpenItem('Invoices', cloned.id);
  }

  openLinkPoModal(): void {
    if (!this.canEditProducts()) return;

    const modal = this.dialogSV.open(LinkPurchaseOrdersModalComponent, {
      header: 'LINK PURCHASE ORDERS',
      width: '60rem',
      closable: false,
      closeOnEscape: false,
      data: {
        invoiceId: this.tabItem.item.id,
        clientId: this.item()?.client?.id,
        linkedPurchaseOrders: this.linkedPurchaseOrders()
      }
    });

    modal.onClose.subscribe({
      next: (resp: { valid: boolean }) => {
        if (resp?.valid) this.reloadInvoice();
      }
    });
  }

  removePo(po: InvoiceAssociatedPo): void {
    if (!this.canEditProducts()) return;

    this.utilSV.confirm({
      message: `Are you sure to remove PO ${po.number} from this invoice?`,
      header: TITLES.confirmation,
      accept: () => {
        this.invoiceSV.unlinkInvoicePurchaseOrder(this.tabItem.item.id, po.id).subscribe({
          next: resp => {
            this.utilSV.setMessage(resp.title, resp.message, 'success');
            this.reloadInvoice();
          },
          error: err => this.utilSV.setMessage(TITLES.error, err?.errorMessage ?? err, 'error')
        });
      }
    });
  }

  // open-lock is the only endpoint that returns the whole detail, and it is
  // idempotent for the user who already holds the lock (§4). rebuildForm() runs
  // too because the read-only totals live in the header FormGroup.
  private reloadInvoice(): void {
    this._loading.set(true);
    this.invoiceSV.openAndLockInvoice(this.tabItem.item.id, this.tabItem.type)
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this._loading.set(false)))
      .subscribe({
        next: resp => {
          this._item.set(resp.data);
          this.rebuildForm();
        },
        error: err => this.utilSV.setMessage(TITLES.error, err, 'error')
      });
  }

  //#endregion

}
