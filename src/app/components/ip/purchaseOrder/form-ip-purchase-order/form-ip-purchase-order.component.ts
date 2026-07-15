import { Component, computed, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { Messages, TitlesMessages } from '@config/messages';
import { CommonPageTab } from '@config/tabs/commonPageTab';
import { EmitedTab } from '@config/types/tabs';
import { ListIpPurchaseOrder, IpPurchaseOrder } from '@interfaces/ip/purchaseOrder';
import { IpPurchaseOrderPermissions } from '@pages/principal/ip/purchase-order/purchase-order.component';
import { environment } from '../../../../../environments/environment';
import { IpPurchaseOrderService } from '@services/ip';
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
  private clientSV = inject(ClientsService);
  private supplierSV = inject(SuppliersService);
  private userSV = inject(UsersService);
  private storageSV = inject(StorageService);
  private navigateSV = inject(NavigateTabsService);
  private emailSV = inject(EmailService);

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
      accept: () => {
        this._loading.set(true);
        this.showForm = false;
        this.ipPurchaseOrderSV.clonePurchaseOrder(this.item()!.id)
          .pipe(
            finalize(() => {
              setTimeout(() => {
                this._loading.set(false);
                this.showForm = true;
              }, TIMEOUT);
            })
          )
          .subscribe({
            next: (resp) => {
              if (this._item()) {
                this._item()!.clonedPOs = [...this._item()!.clonedPOs, resp.data];
              }
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
    this.formTab.patchValue({ status: this.item()?.status ?? 'ACTIVE' });
  }

  private executeChangeStatus(action: Observable<MessageResponse<ListIpPurchaseOrder>>, newStatus: 'CREATED' | 'ANSWERED' | 'SENT' | 'COMPLETE' | 'REJECTED') {
    this._loading.set(true);
    this.showForm = false;
    action
      .pipe(finalize(() => {
        setTimeout(() => {
          this._loading.set(false);
          this.enableForm();
        }, TIMEOUT);
      }))
      .subscribe({
        next: (resp) => {
          this.utilSV.setMessage(resp.title, resp.message, 'success');
          this._item()!.status = newStatus;
          this.tabItem.item.status = newStatus;
          if (newStatus === 'COMPLETE' || newStatus === 'REJECTED') {
            this.tabItem.type = 'view';
          } else {
            this.tabItem.type = 'edit';
          }
          if (newStatus !== 'SENT') {
            this.tabItem.pristine = true;
          }
        },
        error: (err) => {
          this.rejectStatusChange(err);
        }
      });
  }

  openHistory(purchaseOrder: IpPurchaseOrder) {
    // TODO: implement history modal
  }

  protected override getRequest() {
    const raw = this.formTab.getRawValue();
    return {
      clientId: raw.clientId,
      supplierId: raw.supplierId,
      currency: raw.currency,
      paymentTerms: raw.paymentTerms,
      leadTime: raw.leadTime,
      leadTimeType: raw.leadTimeType,
      salesRepId: raw.salesRepId,
      shipToName: raw.shipToName,
      shipToAddress: raw.shipToAddress,
      shipToCity: raw.shipToCity,
      shipToPhone: raw.shipToPhone,
      shipToContactName: raw.shipToContactName,
      shipToEmail: raw.shipToEmail,
      salesTax: raw.salesTax,
      status: raw.status,
      remarks: raw.remarks,
      internalRemarks: raw.internalRemarks
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
        [Validators.required]
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
      shipToCity: [
        this.item()?.shipToCity?.name ?? null,
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
        0,
        []
      ],
      freightCharges: [
        0,
        []
      ],
      otherCharges: [
        0,
        []
      ],
      total: [
        0,
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

    [
      'leadTime',
      'salesTax',
      'shipToName',
      'shipToAddress',
      'shipToCity',
      'shipToPhone',
      'shipToContactName',
      'shipToEmail',
      'clientAddress',
      'supplierAddress',
      'shippingMethod',
      'subTotal',
      'freightCharges',
      'otherCharges',
      'total'
    ].forEach(field => controls[field].disable());

    this.showForm = true;
    this.searchSupplier({ query: '', originalEvent: new Event('') });
    this.searchClient({ query: '', originalEvent: new Event('') });

    if (type === 'view') {
      this.formTab.disable();
    }
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
      return this.ipPurchaseOrderSV.updatePurchaseOrder(this.tabItem.item.id, this.formTab.getRawValue());
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
    return this.supplierSV.filteredList;
  }

  searchSupplier(event: AutoCompleteCompleteEvent) {
    this.supplierSV.searchAutoComplete(event);
  }

  changeSupplier(event: AutoCompleteSelectEvent) {
    this.formTab.controls['supplierContactId'].enable();
    this.formTab.patchValue({
      supplierContactId: null,
      supplierAddress: event.value.address,
      paymentTerms: event.value.paymentTerms
    });
    this.assignListSupplierContact(event.value.infoByDepartment);
    if (!this.permissions().editPaymentTermsPurchaseOrder) {
      this.formTab.controls['paymentTerms'].disable();
    }
  }

  clearSupplier() {
    this.formTab.patchValue({ supplierId: null, supplierContactId: null, paymentTerms: null, supplierAddress: null });
    this._listSupplierContact.set([]);
    this.formTab.controls['supplierContactId'].disable();
  }

  openPurchaseOrder(purchaseOrder: ListIpPurchaseOrder) {
    this.opened.emit({
      type: this.permissions().updatePurchaseOrder ? 'edit' : 'view',
      item: purchaseOrder,
      pristine: true
    });
  }

  openQuotation(quotation: { id: string; number: string }) {
    this.navigateSV.openModuleNewTabAndOpenItem('Quotations', quotation.id);
  }

  openProduct(productId: string) {
    this.navigateSV.openModuleNewTabAndOpenItem('Products', productId);
  }

  openModalProduct(type: 'create' | 'edit', productId?: string) {
    if (this.tabItem.type !== 'edit') return;
    // TODO: implement product modal
  }

  openModalListOtherCharges() {
    if (this.tabItem.type === 'create') return;
    // TODO: implement list other charges modal
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
