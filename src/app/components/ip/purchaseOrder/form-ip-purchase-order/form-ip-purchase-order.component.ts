import { Component, computed, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { Messages, TitlesMessages } from '@config/messages';
import { CommonPageTab } from '@config/tabs/commonPageTab';
import { EmitedTab } from '@config/types/tabs';
import { ListIpPurchaseOrder, IpPurchaseOrder } from '@interfaces/ip/purchaseOrder';
import { IpPurchaseOrderPermissions } from '@pages/principal/ip/purchase-order/purchase-order.component';
import { environment } from '../../../../../environments/environment';
import { IpPurchaseOrderService, IpQuotationService } from '@services/ip';
import { CityService } from '@services/masters';
import { BasicCity } from '@interfaces/masters/locations/cities';
import { UpdatePurchaseOrderRequest } from '@interfaces/ip/purchaseOrder';
import { StaticListItem } from '@interfaces/static-list.model';
import { FormGroup, Validators } from '@angular/forms';
import { DropdownChangeEvent } from 'primeng/dropdown';
import { ClientsService, SuppliersService } from '@services/partners';
import { UsersService } from '@services/admin';
import { BasicUser, UserInfo } from '@interfaces/administration/user';
import { EmailService, NavigateTabsService, StorageService } from '@services/util';
import { constants, emailBodyTemplates, storageKeys } from '../../../../../environments';
import { ClientBasic, ClientContact, ClientInfoDep } from '@interfaces/partners/clients';
import { AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { SupplierBasic, SupplierContact, SupplierInfoDep } from '@interfaces/partners/suppliers';
import { finalize, Observable } from 'rxjs';
import { MessageResponse } from '@interfaces/message-response';
import { ChangeQuotationModalComponent } from '@modals/ip/po/change-quotation-modal/change-quotation-modal.component';
import { AddPoProductModalComponent } from '@modals/ip/po/add-po-product-modal/add-po-product-modal.component';
import { PoListOtherChargesModalComponent } from '@modals/ip/po/po-list-other-charges-modal/po-list-other-charges-modal.component';
import { IpPurchaseOrderProduct } from '@interfaces/ip/purchaseOrder';

const MESSAGES = Messages.pages.ip.purchaseOrder;
const TITLES = TitlesMessages;
const TIMEOUT = environment.timeout;

@Component({
  selector: 'app-form-ip-purchase-order',
  templateUrl: './form-ip-purchase-order.component.html',
  styleUrl: './form-ip-purchase-order.component.scss'
})
export class FormIpPurchaseOrderComponent extends CommonPageTab<ListIpPurchaseOrder, IpPurchaseOrderPermissions, IpPurchaseOrder> implements OnInit {

  @Output() opened = new EventEmitter<EmitedTab<ListIpPurchaseOrder>>();

  private ipPurchaseOrderSV = inject(IpPurchaseOrderService);
  private ipQuotationSV = inject(IpQuotationService);
  private clientSV = inject(ClientsService);
  private supplierSV = inject(SuppliersService);
  private citySV = inject(CityService);
  private userSV = inject(UsersService);
  private storageSV = inject(StorageService);
  private navigateSV = inject(NavigateTabsService);
  private emailSV = inject(EmailService);

  // Rule 2B: when the PO has a quotation, suppliers must come from that Q's
  // supplier set (reachable through its Quote Requests) — not the general catalog.
  // Only the ids are kept here; the getter below cross-references them against
  // supplierSV.list() (the full catalog, loaded with infoByDepartment) so the
  // Supplier Contact dropdown always has data, regardless of load order.
  private _quotationSupplierIds = signal<Set<string>>(new Set());
  private _suppliersLoadedForQ: string | null = null;

  listIpPurchaseOrderStatus = computed<StaticListItem[]>(() => this.staticListSV.getListIpPurchaseOrderStatus());
  listCurrency = computed<StaticListItem[]>(() => this.staticListSV.getListCurrency());
  listPaymenTerms = computed<StaticListItem[]>(() => this.staticListSV.getListPaymentTerms());
  listLeadTimeType = computed<StaticListItem[]>(() => this.staticListSV.getListLeadTimeType());

  private _listEmployees = signal<BasicUser[]>([]);
  listEmployees = computed<BasicUser[]>(() => this._listEmployees());

  private _listSupplierContact = signal<SupplierContact[]>([]);
  listSupplierContact = computed<SupplierContact[]>(() => this._listSupplierContact());
  private _listClientContact = signal<ClientContact[]>([]);
  listClientContact = computed<ClientContact[]>(() => this._listClientContact());

  private userData = computed<UserInfo | null>(() => this.storageSV.getPlain<UserInfo>(storageKeys.user_data.info))

  constructor() {
    super(MESSAGES);
    this.userSV.loadEmployees(false);
    this.supplierSV.loadAllBasic();
    this.clientSV.loadAllBasic();
    this.citySV.loadCities();
  }

  ngOnInit(): void {
    if (this.tabItem.item.status === 'COMPLETE' || this.tabItem.item.status === 'REJECTED') {
      this.tabItem.type = 'view';
    }
    this.onInitAction({
      updatePermission: this.permissions().updatePurchaseOrder,
      openAndLock: this.ipPurchaseOrderSV.openAndLockPurchaseOrder(this.tabItem.item.id, this.tabItem.type),
      module: 'PO'
    });
  }

  clonePO() {
    if (this.tabItem.type === 'create') return;
    this.utilSV.confirm({
      message: MESSAGES.clone(this.item()!.number),
      header: TITLES.confirmation,
      accept: () => {
        this._loading.set(true);
        this.showForm = false;
        this.ipPurchaseOrderSV.clonePurchaseOrder(this.item()!.id)
          .pipe(
            finalize(() => {
              setTimeout(() => {
                this._loading.set(false);
                this.enableForm();
              }, TIMEOUT);
            })
          )
          .subscribe({
            next: (resp) => {
              this._item.update(item => item ? { ...item, clonedPOs: [...(item.clonedPOs ?? []), resp.data] } : item);
              this.utilSV.setMessage(resp.title, resp.message, 'success');
              this.opened.emit({
                type: this.permissions().updatePurchaseOrder ? 'edit' : 'view',
                item: resp.data,
                pristine: true
              });
            }, error: (err) => {
              this.utilSV.setMessage(TITLES.error, err, 'error');
            }
          })
      }
    })
  }

  printPO() {
    this.downloadFile(this.ipPurchaseOrderSV.printPurchaseOrder(this.item()!.id), this.item()!.number);
  }

  printAndSendPO() {
    if (this.item()!.products.length <= 0) {
      this.formTab.patchValue({ status: this.item()!.status });
      return;
    }
    this._loadingPrintAndSent.set(true);
    this.ipPurchaseOrderSV.printPurchaseOrder(this.item()!.id)
      .pipe(finalize(() => {
        setTimeout(() => {
          this._loadingPrintAndSent.set(false);
        }, TIMEOUT);
      }))
      .subscribe({
        next: (file) => {
          this.emailSV.openModalEmail({
            tittle: `SEND PURCHASE ORDER ${this.item()!.number}`,
            subjectTemplate: `Purchase Order`,
            bodyTemplate: emailBodyTemplates.ip_purchase_order(this.item()!.supplierContact?.name),
            toTemplate: [this.item()?.supplierContact?.email].filter((e): e is string => !!e),
            attachmentsTemplate: [
              {
                name: `${this.item()!.number}.pdf`,
                data: file
              }
            ]
          }).onClose.subscribe({
            next: (modal) => {
              if (modal.valid && this.item()?.status === 'CREATED') {
                this.executeChangeStatus(this.ipPurchaseOrderSV.changeStatusPurchaseOrder(this.item()!.id, 'SENT'), 'SENT');
                this.formTab.patchValue({ status: 'SENT' });
              }
            }
          });
        },
        error: (err) => {
          this.utilSV.setMessage('Error', 'Error printing the document', 'error');
        }
      });
  }

  changeStatus(event: DropdownChangeEvent) {
    const poId = this.tabItem.item.id;
    const poNumber = this.tabItem.item.name;

    // RBAC 4004004: rejecting requires the dedicated permission.
    if (event.value === 'REJECTED' && !this.permissions().rejectPurchaseOrder) {
      this.resetFormStatus();
      this.utilSV.setMessage(TITLES.warning, 'You do not have permission to reject this Purchase Order.', 'warn');
      return;
    }

    const actions: Record<string, () => void> = {
      CREATED: () => this.handleChangeStatus(
        MESSAGES.changeStatus(poNumber, 'CREATED'),
        () => this.ipPurchaseOrderSV.changeStatusPurchaseOrder(poId, 'CREATED'),
        'CREATED'
      ),
      SENT: () => this.handleChangeStatus(
        MESSAGES.changeStatus(poNumber, 'SENT'),
        () => this.ipPurchaseOrderSV.changeStatusPurchaseOrder(poId, 'SENT'),
        'SENT'
      ),
      ANSWERED: () => this.handleChangeStatus(
        MESSAGES.changeStatus(poNumber, 'ANSWERED'),
        () => this.ipPurchaseOrderSV.changeStatusPurchaseOrder(poId, 'ANSWERED'),
        'ANSWERED'
      ),
      COMPLETE: () => this.handleChangeStatus(
        MESSAGES.changeStatus(poNumber, 'COMPLETE'),
        () => this.ipPurchaseOrderSV.changeStatusPurchaseOrder(poId, 'COMPLETE'),
        'COMPLETE'
      ),
      REJECTED: () => this.handleChangeStatus(
        MESSAGES.changeStatus(poNumber, 'REJECTED'),
        () => this.ipPurchaseOrderSV.rejectPurchaseOrder(poId),
        'REJECTED'
      ),
    };
    actions[event.value]?.();
  }

  private handleChangeStatus(
    message: string,
    action: () => Observable<MessageResponse<ListIpPurchaseOrder>>,
    newStatus: 'CREATED' | 'ANSWERED' | 'SENT' | 'COMPLETE' | 'REJECTED'
  ) {
    this.utilSV.confirm({
      message,
      header: TITLES.confirmation,
      accept: () => this.executeChangeStatus(action(), newStatus),
      reject: () => this.resetFormStatus()
    });
  }

  private rejectStatusChange(errorMessage: string) {
    this.resetFormStatus();
    this.utilSV.setMessage(TITLES.error, errorMessage, 'error');
  }

  private resetFormStatus() {
    this.formTab.patchValue({ status: this.item()?.status ?? 'CREATED' });
  }

  private executeChangeStatus(action: Observable<MessageResponse<ListIpPurchaseOrder>>, newStatus: 'CREATED' | 'ANSWERED' | 'SENT' | 'COMPLETE' | 'REJECTED') {
    this._loading.set(true);
    this.showForm = false;
    action
      .subscribe({
        next: (resp) => {
          this.utilSV.setMessage(resp.title, resp.message, 'success');
          this.tabItem.item.status = newStatus;
          if (newStatus === 'COMPLETE' || newStatus === 'REJECTED') {
            this.tabItem.type = 'view';
          } else {
            this.tabItem.type = 'edit';
          }
          if (newStatus !== 'SENT') {
            this.tabItem.pristine = true;
          }
          // The change-status endpoint only returns a lightweight response
          // (no sentAt/answeredAt/completeAt/rejectAt) — reload the full PO
          // so the new status date shows up immediately.
          this.reloadPurchaseOrder();
        },
        error: (err) => {
          this._loading.set(false);
          this.showForm = true;
          this.rejectStatusChange(err);
        }
      });
  }

  openHistory(purchaseOrder: IpPurchaseOrder) {
    // TODO: implement history modal
  }

  protected override getRequest(): UpdatePurchaseOrderRequest {
    const raw = this.formTab.getRawValue();
    return {
      clientId: raw.clientId,
      clientContactId: raw.clientContactId ?? null,
      clientPoNumber: raw.clientPoNumber ?? null,
      currency: raw.currency,
      supplierId: raw.supplierId,
      supplierContactId: raw.supplierContactId ?? null,
      supplierPoNumber: raw.supplierPoNumber ?? null,
      paymentTerms: raw.paymentTerms ?? null,
      shippingMethod: raw.shippingMethod ?? null,
      salesRepId: raw.salesRepId,
      leadTime: raw.leadTime,
      leadTimeType: raw.leadTimeType,
      salesTax: raw.salesTax,
      shipToName: raw.shipToName,
      shipToAddress: raw.shipToAddress,
      shipToCityId: raw.shipToCityId,
      shipToPhone: raw.shipToPhone,
      shipToContactName: raw.shipToContactName,
      shipToEmail: raw.shipToEmail,
      status: raw.status,
      remarks: raw.remarks ?? null,
      internalRemarks: raw.internalRemarks ?? null
    };
  }

  protected override buildFormAction(): void {
    this.formTab = this.formBuilder.group({
      currency: [
        this.item()?.currency ?? 'USD',
        [Validators.required]
      ],
      clientId: [
        this.item()?.client?.id ?? null,
        [Validators.required]
      ],
      clientContactId: [
        this.item()?.clientContact?.id ?? null,
        []
      ],
      clientAddress: [
        this.item()?.client?.address ?? null,
        []
      ],
      clientPoNumber: [
        this.item()?.clientPoNumber ?? null,
        []
      ],
      supplierId: [
        this.item()?.supplier?.id ?? null,
        []
      ],
      supplierContactId: [
        this.item()?.supplierContact?.id ?? null,
        []
      ],
      supplierAddress: [
        this.item()?.supplier?.address ?? null,
        []
      ],
      supplierPoNumber: [
        this.item()?.supplierPoNumber ?? null,
        []
      ],
      salesRepId: [
        this.item()?.salesRep?.id ?? this.userData()?.id,
        [Validators.required]
      ],
      paymentTerms: [
        this.item()?.paymentTerms ?? null,
        []
      ],
      leadTime: [
        this.item()?.leadTime ?? 0,
        []
      ],
      leadTimeType: [
        this.item()?.leadTimeType ?? 'WEEKS',
        []
      ],
      shippingMethod: [
        this.item()?.shippingMethod ?? null,
        []
      ],
      shipToName: [
        this.item()?.shipToName ?? null,
        []
      ],
      shipToAddress: [
        this.item()?.shipToAddress ?? null,
        []
      ],
      shipToCityId: [
        this.item()?.shipToCity?.id ?? null,
        []
      ],
      shipToPhone: [
        this.item()?.shipToPhone ?? null,
        []
      ],
      shipToContactName: [
        this.item()?.shipToContactName ?? null,
        []
      ],
      shipToEmail: [
        this.item()?.shipToEmail ?? null,
        []
      ],
      salesTax: [
        this.item()?.salesTax ?? 0,
        []
      ],
      status: [
        this.item()?.status ?? 'CREATED',
        [Validators.required]
      ],
      remarks: [
        this.item()?.remarks ?? null,
        []
      ],
      internalRemarks: [
        this.item()?.internalRemarks ?? null,
        []
      ],
      subTotal: [
        this.item()?.subTotal ?? 0,
        []
      ],
      otherCharges: [
        this.item()?.totalOtherCharges ?? 0,
        []
      ],
      total: [
        this.item()?.total ?? 0,
        []
      ]
    });
  }

  protected override enableForm(): void {
    const item = this.item();
    const type = this.tabItem.type;
    const perms = this.permissions();
    const controls = this.formTab.controls;

    this.formTab.enable();
    controls['status'].disable();

    if (type === 'edit' && perms.updatePurchaseOrder) {
      controls['status'].enable();
    }

    const employees = this.userSV.listEmployees();
    this._listEmployees.set(employees);
    if (item?.salesRep && !employees.some(e => e.id === item.salesRep.id)) {
      this._listEmployees().push(item.salesRep);
    }

    if (type === 'create') {
      controls['salesRepId'].disable();
    }

    // Rule 2E: payment terms only editable with the dedicated permission (4004005).
    if (!perms.editPaymentTermsPurchaseOrder) {
      controls['paymentTerms'].disable();
    }

    ['clientContactId', 'supplierContactId'].forEach(id => controls[id].disable());

    if (type !== 'create' && item) {
      if (item.supplier) {
        controls['supplierContactId'].enable();
        this.assignListSupplierContact(item.supplier.infoByDepartment);
      }
      if (item.client) {
        controls['clientContactId'].enable();
        this.assignListClientContact(item.client.infoByDepartment);
      }
    }

    // Display-only fields (kept read-only). Ship To*, leadTime and shippingMethod
    // are intentionally NOT here — rules 2D and 2F make them freely editable.
    [
      'clientAddress',
      'supplierAddress',
      'subTotal',
      'otherCharges',
      'total'
    ].forEach(field => controls[field].disable());

    // Rule 2A: a PO with an attached quotation locks Client and Currency
    // (the backend ignores changes to them anyway — §1.3).
    if (item?.quotation) {
      controls['clientId'].disable();
      controls['currency'].disable();
    }

    // Rule 2C: once ANSWERED the supplier is frozen (§1.4).
    if (item?.status === 'ANSWERED') {
      controls['supplierId'].disable();
    }

    // No Q attached: supplier isn't required and its whole block stays disabled
    // (there's no Q-scoped supplier set to pick from — Rule 2B).
    if (!item?.quotation) {
      ['supplierId', 'supplierContactId', 'supplierPoNumber'].forEach(id => controls[id].disable());
    }

    this.loadQuotationSuppliers();

    // Pre-load current client into filtered list so autocomplete shows name, not id
    if (item?.client && !this.clientSV.filteredList.some(c => c.id === item.client!.id)) {
      const clientBasic: ClientBasic = {
        id: item.client.id,
        name: item.client.name,
        code: item.client.code,
        address: item.client.address,
        showName: `${item.client.code} - ${item.client.name}`,
        paymentTerms: item.client.paymentTerms,
        infoByDepartment: item.client.infoByDepartment
      };
      this.clientSV.filteredList = [clientBasic, ...this.clientSV.filteredList];
    }

    this.showForm = true;
    this.searchClient({ query: '', originalEvent: new Event('') });
    this.searchCity({ query: '', originalEvent: new Event('') });

    if (type === 'view') {
      this.formTab.disable();
    }
  }

  // Rule 2B — pull the associated Quotation's supplier set (reachable via its
  // Quote Requests) so the Supplier autocomplete never offers the general catalog.
  private loadQuotationSuppliers(): void {
    const item = this.item();
    const quotationId = item?.quotation?.id;

    if (!quotationId) {
      this._quotationSupplierIds.set(new Set());
      this._suppliersLoadedForQ = null;
      return;
    }
    if (this._suppliersLoadedForQ === quotationId) return;
    this._suppliersLoadedForQ = quotationId;

    // This endpoint returns lightweight suppliers (id/name only, no
    // infoByDepartment) — it only exists to list/label suppliers in the
    // create-PO modal. Only the ids are kept; filteredSupplier cross-references
    // them against the full supplier catalog for infoByDepartment.
    this.ipQuotationSV.getQuotationsAvailableForPurchaseOrder(item!.client.id, true, item!.currency)
      .subscribe({
        next: list => {
          const ids = (list.find(q => q.id === quotationId)?.suppliers ?? []).map(s => s.id);
          this._quotationSupplierIds.set(new Set(ids));
        },
        error: () => this._quotationSupplierIds.set(new Set())
      });
  }

  override onSubmit(): void {
    if (this.tabItem.pristine) return;
    if (this.tabItem.type === 'view') return;
    this.onSubmitAction({
      updatePermission: this.permissions().updatePurchaseOrder,
      action: this.getSubmitAction()
    });
  }

  private getSubmitAction(): Observable<MessageResponse<IpPurchaseOrder>> {
    if (this.tabItem.type === 'create') {
      return this.ipPurchaseOrderSV.createPurchaseOrder({ clientId: this.formTab.getRawValue().clientId });
    } else if (this.tabItem.type === 'edit') {
      return this.ipPurchaseOrderSV.updatePurchaseOrder(this.tabItem.item.id, this.getRequest());
    } else {
      throw new Error('Invalid tab type for submit');
    }
  }

  get filteredClients(): ClientBasic[] {
    return this.clientSV.filteredList;
  }

  searchClient(event: AutoCompleteCompleteEvent) {
    this.clientSV.searchAutoComplete(event);
  }

  changeClient(event: AutoCompleteSelectEvent) {
    this.formTab.controls['clientContactId'].enable();
    this.formTab.patchValue({
      clientContactId: null,
      clientAddress: event.value.address
    });
    this.assignListClientContact(event.value.infoByDepartment);
  }

  clearClient() {
    this.formTab.patchValue({ clientId: null, clientContactId: null, clientAddress: null });
    this._listClientContact.set([]);
    this.formTab.controls['clientContactId'].disable();
  }

  private assignListClientContact(infoByDepartment: ClientInfoDep[]) {
    const cloneDepInfo = this.clone<ClientInfoDep[]>(infoByDepartment);
    let listContacts: ClientContact[] = [];
    cloneDepInfo.forEach(dep => {
      if (dep.department.id === constants.ip_department_id) {
        dep.listContacts.map(contact => {
          contact.name = `${contact.name}  ${contact.active ? '' : '(DISABLED)'}`;
        });
        listContacts = listContacts.concat(dep.listContacts);
      }
    });
    this._listClientContact.set(listContacts);
  }

  get filteredSupplier(): SupplierBasic[] {
    // Rule 2B: restrict to the quotation's supplier set when a Q is attached.
    // Cross-referencing against supplierSV.list() (full catalog with
    // infoByDepartment) instead of the lightweight Q-suppliers response.
    if (this.item()?.quotation) {
      const ids = this._quotationSupplierIds();
      return this.supplierSV.list().filter(s => ids.has(s.id));
    }
    return this.supplierSV.list();
  }


  get filteredCities(): BasicCity[] {
    return this.citySV.filteredCities;
  }

  searchCity(event: AutoCompleteCompleteEvent) {
    this.citySV.searchAutoComplete(event);
  }

  changeSupplier(event: any) {
    const supplierId = event?.value ?? event;
    const supplier = this.filteredSupplier.find(s => s.id === supplierId);
    if (!supplier) return;
    this.formTab.controls['supplierContactId'].enable();
    this.formTab.patchValue({
      supplierContactId: null,
      supplierAddress: supplier.address,
      paymentTerms: supplier.paymentTerms
    });
    this.assignListSupplierContact(supplier.infoByDepartment);
    if (!this.permissions().editPaymentTermsPurchaseOrder) {
      this.formTab.controls['paymentTerms'].disable();
    }
  }

  clearSupplier() {
    this.formTab.patchValue({ supplierId: null, supplierContactId: null, paymentTerms: null, supplierAddress: null });
    this._listSupplierContact.set([]);
    this.formTab.controls['supplierContactId'].disable();
  }

  openPurchaseOrder(purchaseOrder: Pick<ListIpPurchaseOrder, 'id' | 'number'>) {
    this.opened.emit({
      type: this.permissions().updatePurchaseOrder ? 'edit' : 'view',
      item: purchaseOrder as ListIpPurchaseOrder,
      pristine: true
    });
  }

  openQuotation(quotation: { id: string; number: string }) {
    this.navigateSV.openModuleNewTabAndOpenItem('Quotations', quotation.id);
  }

  openChangeQuotationModal() {
    if (this.tabItem.type !== 'edit' || !this.item()) return;
    const modal = this.dialogSV.open(ChangeQuotationModalComponent, {
      header: 'CHANGE QUOTATION',
      width: '60rem',
      closable: false,
      closeOnEscape: false,
      data: {
        poId: this.item()!.id,
        clientId: this.item()!.client.id,
        currency: this.item()!.currency,
        currentQuotationId: this.item()?.quotation?.id ?? null
      }
    });
    modal.onClose.subscribe({
      next: (resp: { valid: boolean; reload?: boolean }) => {
        // Rule 8E: changing/removing a Q purges data server-side — always full-reload.
        if (resp?.valid && resp.reload) {
          this.tabItem.pristine = true;
          this.reloadPurchaseOrder();
        }
      }
    });
  }

  openProduct(productId: string) {
    this.navigateSV.openModuleNewTabAndOpenItem('Products', productId);
  }

  // 10A: only openable on an editable PO that already has a quotation and a supplier.
  canAddProducts(): boolean {
    return this.tabItem.type === 'edit' && !!this.item()?.quotation && !!this.item()?.supplier;
  }

  openModalProduct() {
    if (!this.canAddProducts()) return;
    const modal = this.dialogSV.open(AddPoProductModalComponent, {
      header: 'ADD PRODUCTS',
      width: '68vw',
      closable: false,
      closeOnEscape: false,
      data: {
        poId: this.item()!.id,
        currency: this.item()!.currency
      }
    });
    modal.onClose.subscribe({
      next: (resp: { valid: boolean }) => {
        if (resp?.valid) this.reloadPurchaseOrder();
      }
    });
  }

  removeProduct(product: IpPurchaseOrderProduct) {
    if (this.tabItem.type !== 'edit') return;
    this.utilSV.confirm({
      message: MESSAGES.removeProduct(product.quotationProduct?.quoteRequestProduct?.ipProduct?.description ?? ''),
      header: TITLES.confirmation,
      accept: () => {
        this._loading.set(true);
        this.showForm = false;
        this.ipPurchaseOrderSV.removeProduct(this.item()!.id, product.id)
          .pipe(finalize(() => this.reloadPurchaseOrder()))
          .subscribe({
            next: resp => this.utilSV.setMessage(resp.title, resp.message, 'success'),
            error: err => this.utilSV.setMessage(TITLES.error, err, 'error')
          });
      }
    });
  }

  // Re-fetches the full PO (products/charges/totals/supplier/etc) after a
  // sub-resource change and fully rebuilds the form from the fresh data —
  // a partial patchValue would leave stale supplier/contact/address fields
  // behind when a Q change/removal purges them server-side (Rule 8E).
  private reloadPurchaseOrder(): void {
    this._loading.set(true);
    this.showForm = false;
    this.ipPurchaseOrderSV.openAndLockPurchaseOrder(this.tabItem.item.id, this.tabItem.type)
      .subscribe({
        next: resp => {
          setTimeout(() => {
            this._item.set(resp.data);
            this._isValidOpen.set(resp.isValidOpen);
            this.rebuildForm();
            this._loading.set(false);
          }, TIMEOUT);
        },
        error: err => {
          this.utilSV.setMessage(TITLES.warning, err, 'warn');
          this._loading.set(false);
        }
      });
  }

  openModalListOtherCharges() {
    if (this.tabItem.type === 'create' || !this.item()) return;
    const modal = this.dialogSV.open(PoListOtherChargesModalComponent, {
      header: 'OTHER CHARGES',
      width: '49vw',
      closable: false,
      closeOnEscape: false,
      data: {
        poId: this.item()!.id,
        type: this.tabItem.type,
        poStatus: this.item()!.status,
        currency: this.item()!.currency,
        hasQuotation: !!this.item()!.quotation,
        otherCharges: this.item()!.otherCharges,
        importedQuotationCharges: this.item()!.importedQuotationCharges,
        importedQuoteRequestCharges: this.item()!.importedQuoteRequestCharges
      }
    });
    modal.onClose.subscribe({
      next: (resp: { valid: boolean }) => {
        if (resp?.valid) this.reloadPurchaseOrder();
      }
    });
  }

  getRemarksSize(): number {
    let resp = 4;
    if (!this.item()?.clonedPOs || this.item()!.clonedPOs.length === 0) {
      resp = resp + 4;
    }
    return resp;
  }

  private assignListSupplierContact(infoByDepartment: SupplierInfoDep[]) {
    const cloneDepInfo = this.clone<SupplierInfoDep[]>(infoByDepartment);
    let listContacts: SupplierContact[] = [];
    cloneDepInfo.forEach(dep => {
      if (dep.department.id === constants.ip_department_id) {
        dep.listContacts.map(contact => {
          contact.name = `${contact.name}  ${contact.active ? '' : '(DISABLED)'}`;
        });
        listContacts = listContacts.concat(dep.listContacts);
      }
    });
    this._listSupplierContact.set(listContacts);
  }
}
