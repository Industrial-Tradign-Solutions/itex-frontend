import { Component, computed, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { Messages, TitlesMessages } from '@config/messages';
import { CommonPageTab } from '@config/tabs/commonPageTab';
import { IpQuotation, ListIpQuotation, mapToIpQuotationRequest, IpQuotationProduct } from '@interfaces/ip/quotation';
import { IpQuotationPermissions } from '@pages/principal/ip/quotations/quotations.component';
import { environment } from '../../../../../environments/environment';
import { IpQuotationService } from '@services/ip';
import { ClientsService } from '@services/partners';
import { UsersService } from '@services/admin';
import { EmailService, NavigateTabsService, StorageService } from '@services/util';
import { StaticListItem } from '@interfaces/static-list.model';
import { BasicUser, UserInfo } from '@interfaces/administration/user';
import { ClientBasic, ClientContact, ClientInfoDep } from '@interfaces/partners/clients';
import { storageKeys, constants } from '../../../../../environments';
import { EmitedTab } from '@config/types/tabs';
import { FormGroup, Validators } from '@angular/forms';
import { DropdownChangeEvent } from 'primeng/dropdown';
import { AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { DialogService } from 'primeng/dynamicdialog';
import { finalize, Observable } from 'rxjs';
import { MessageResponse } from '@interfaces/message-response';
import { FormArray } from '@angular/forms';
import { QuotationProductModalComponent } from '@modals/ip/q/quotation-product-modal/quotation-product-modal.component';
import { ListOtherChargesModalComponent } from '@modals/ip/q/list-other-charges-modal/list-other-charges-modal.component';
import { AddQuoteRequestsModalComponent } from '@modals/ip/q/add-quote-requests-modal/add-quote-requests-modal.component';

const MESSAGES = Messages.pages.ip.quotation;
const TITLES = TitlesMessages;
const TIMEOUT = environment.timeout;

@Component({
  selector: 'app-form-ip-quotation',
  templateUrl: './form-ip-quotation.component.html',
  styleUrl: './form-ip-quotation.component.scss'
})
export class FormIpQuotationComponent extends CommonPageTab<ListIpQuotation, IpQuotationPermissions, IpQuotation> implements OnInit {

  @Output() opened = new EventEmitter<EmitedTab<ListIpQuotation>>();

  //! Inyecciones
  private quotetationSV       = inject(IpQuotationService);
  private clientSV            = inject(ClientsService);
  private userSV              = inject(UsersService);
  private storageSV           = inject(StorageService);
  private navigateSV          = inject(NavigateTabsService);
  private emailSV             = inject(EmailService);
  protected override dialogSV = inject(DialogService);
  //! _________________________________________________________________
  //* Señales
  listIpQuotationStatus = computed<StaticListItem[]>(() => this.staticListSV.getListIpQuotationStatus());
  listCurrency = computed<StaticListItem[]>(() => this.staticListSV.getListCurrency());
  listIncoterms = computed<StaticListItem[]>(() => this.staticListSV.getListIncoterms());
  listLeadTimeType = computed<StaticListItem[]>(() => this.staticListSV.getListLeadTimeType());
  listPaymenTerms = computed<StaticListItem[]>(() => this.staticListSV.getListPaymentTerms());

  private _listEmployees = signal<BasicUser[]>([]);
  listEmployees = computed<BasicUser[]>(() => this._listEmployees());
  private _listClientContact = signal<ClientContact[]>([]);
  listClientContact = computed<ClientContact[]>(() => this._listClientContact());
  private userData = computed<UserInfo | null>(() => this.storageSV.getPlain<UserInfo>(storageKeys.user_data.info))
  //* -----------------------------------------------------------
  //? Variables
  //?------------------------------------------------------------

  constructor() {
    super(MESSAGES);
    this.userSV.loadEmployees(false);
    this.clientSV.loadAllBasic();
  }

  ngOnInit(): void {
    if (this.tabItem.item.status === 'COMPLETE' || this.tabItem.item.status === 'REJECTED') {
      this.tabItem.type = 'view';
    }
    this.onInitAction({
      updatePermission: this.permissions().updateIpQuotation,
      openAndLock: this.quotetationSV.openAndLockQuotation(this.tabItem.item.id, this.tabItem.type),
      module: 'Q'
    });
  }

  openQuoteRequest(qr: {id?: string, number?: string}) {
    if (qr.id) {
      this.navigateSV.openModuleNewTabAndOpenItem('Quote_Requests', qr.id);
    }
  }

  openQuotation(quotation: ListIpQuotation) {
    this.opened.emit({
      type: this.permissions().updateIpQuotation ? 'edit' : 'view',
      item: quotation,
      pristine: true
    });
  }

  openPurchaseOrder(po: {id?: string, number?: string}) {
    // TODO: Implementar navegación cuando el módulo de Purchase Orders esté disponible
    // if (po.id) {
    //   this.navigateSV.openModuleNewTabAndOpenItem('Purchase_Orders', po.id);
    // }
  }

  changeStatus(event: DropdownChangeEvent) {
    const qId = this.tabItem.item.id;
    const qNumber = this.tabItem.item.name;

    const actions: Record<string, () => void> = {
      CREATED: () => this.handleChangeStatus(
        MESSAGES.changeStatus(qNumber, 'CREATED'),
        () => this.quotetationSV.changeStatusQuotation(qId, 'CREATED'),
        'CREATED'
      ),
      SENT: () => this.handleChangeStatus(
        MESSAGES.changeStatus(qNumber, 'SENT'),
        () => this.quotetationSV.changeStatusQuotation(qId, 'SENT'),
        'SENT'
      ),
      ANSWERED: () => this.handleChangeStatus(
        MESSAGES.changeStatus(qNumber, 'ANSWERED'),
        () => this.quotetationSV.changeStatusQuotation(qId, 'ANSWERED'),
        'ANSWERED'
      ),
      COMPLETE: () => this.handleChangeStatus(
        MESSAGES.changeStatus(qNumber, 'COMPLETE'),
        () => this.quotetationSV.changeStatusQuotation(qId, 'COMPLETE'),
        'COMPLETE'
      ),
      REJECTED: () => this.handleChangeStatus(
        MESSAGES.changeStatus(qNumber, 'REJECTED'),
        () => this.quotetationSV.rejectQuotation(qId),
        'REJECTED'
      ),
    };
    actions[event.value]?.();
  }

  private handleChangeStatus(
    message: string,
    action: () => Observable<MessageResponse<IpQuotation>>,
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

  private executeChangeStatus(action: Observable<MessageResponse<IpQuotation>>, newStatus: 'CREATED' | 'ANSWERED' | 'SENT' | 'COMPLETE' | 'REJECTED') {
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

        if (newStatus === 'SENT') {
          this.item()!.sentAt = new Date().toISOString();
        } else if (newStatus === 'ANSWERED') {
          this.item()!.answeredAt = new Date().toISOString();
        } else if (newStatus === 'REJECTED') {
          this.item()!.rejectAt = new Date().toISOString();
        } else if (newStatus === 'COMPLETE') {
          this.item()!.completeAt = new Date().toISOString();
        }
      },
      error: (err) => {
        this.rejectStatusChange(err);
      }
    });
  }

  protected override getRequest() {
    return mapToIpQuotationRequest(this.formTab.getRawValue());
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
      clientAddress: [
        this.item()?.client?.address ?? null,
        []
      ],
      clientContactId: [
        this.item()?.clientContact?.id ?? null,
        []
      ],
      clientQrNumber: [
        this.item()?.clientQNumber ?? null,
        []
      ],
      salesRepId: [
        this.item()?.salesRep?.id ?? this.userData()?.id,
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
      leadTime: [
        this.item()?.leadTime ?? 0,
        []
      ],
      leadTimeType: [
        this.item()?.leadTimeType ?? 'DAYS',
        []
      ],
      validity: [
        this.item()?.validity ?? 0,
        []
      ],
      validityType: [
        this.item()?.validityType ?? 'DAYS',
        []
      ],
      incoterms: [
        this.item()?.incoterms ?? null,
        []
      ],
      paymentTerms: [
        this.item()?.paymentTerms ?? null,
        []
      ],
      status: [
        this.item()?.status ?? 'CREATED',
        [Validators.required]
      ],
      products: this.getProducts(this.item()?.products),
      grossWeightLbs: [
        this.item()?.grossWeightLbs ?? 0,
      ],
      subTotal: [
        this.item()?.subTotal ?? 0,
      ],
      freightCharges: [
        this.item()?.freightCharges ?? 0,
      ],
      otherCharges: [
        this.item()?.totalOtherCharges ?? 0,
      ],
      total: [
        this.item()?.total ?? 0,
      ]
    });
  }

  protected override enableForm(): void {
    const item = this.item();
    const type = this.tabItem.type;
    const perms = this.permissions();
    const controls = this.formTab.controls;

    // 🔹 Inicialización general
    this.formTab.enable();
    controls['status'].disable();

    // 🔹 Permitir edición de estado si aplica
    if (type === 'edit' && perms.updateIpQuotation) {
      controls['status'].enable();
    }

    // 🔹 Configurar lista de empleados
    const employees = this.userSV.listEmployees();
    this._listEmployees.set(employees);
    if (item?.salesRep && !employees.some(e => e.id === item.salesRep.id)) {
      this._listEmployees().push(item.salesRep);
    }

    // 🔹 Deshabilitar campos base
    ['clientContactId'].forEach(id => controls[id].disable());

    // 🔹 Configuración según tipo
    if (type === 'create') {
      controls['salesRepId'].disable();
    } else if (item) {
      if (item.client) {
        controls['clientContactId'].enable();
        this.assignListClientContact(item.client.infoByDepartment);
      }
    }

    // 🔹 Deshabilitar campos con permisos limitados
    if (!perms.editPaymentTermsIpQuotation) {
      controls['paymentTerms'].disable();
    }

    // 🔹 Deshabilitar campos de solo lectura
    [
      'clientAddress',
      'grossWeightLbs',
      'subTotal',
      'otherCharges',
      'freightCharges',
      'total'
    ].forEach(field => controls[field].disable());



    // 🔹 Mostrar formulario y cargar datos
    this.showForm = true;
    this.searchClient({ query: '', originalEvent: new Event('') });

    if (item?.listQuoteRequests && item.listQuoteRequests.length > 0) {
      controls['clientId'].disable();
      controls['currency'].disable();
    }

    // 🔹 Si es solo vista, deshabilitar todo
    if (type === 'view') {
      this.formTab.disable();
    }
  }

  override onSubmit(): void {
    if(this.tabItem.pristine) return;
    if(this.tabItem.type === 'view') return;
    this.onSubmitAction({
      updatePermission: this.permissions().updateIpQuotation,
      action: this.getSubmitAction()
    });
  }

  private getSubmitAction(): Observable<MessageResponse<IpQuotation>> {
    const data = this.getRequest();
    if (this.tabItem.type === 'edit') {
      return this.quotetationSV.updateQuotation(this.tabItem.item.id, data);
    } else {
      throw new Error('Invalid tab type');
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
    this.formTab.controls['paymentTerms'].enable();

    this.formTab.patchValue({
      clientContactId: null,
      clientAddress: event.value.address,
      paymentTerms: event.value.paymentTerms
    });
    this.assignListClientContact(event.value.infoByDepartment);

    if (!this.permissions().editPaymentTermsIpQuotation) {
      this.formTab.controls['paymentTerms'].disable();
    }
  }

  clearClient(event: any) {
    this.formTab.patchValue({
      clientContactId: null,
      clientAddress: null,
      paymentTerms: null
    });
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

  private getProducts(products?: IpQuotationProduct[]): FormArray {
    if (products && products.length > 0)  {
      return this.formBuilder.array(
        products.map( product => this.formProduct(product))
      );
    } else {
      return this.formBuilder.array([]);
    }
  }

  private formProduct(product?: IpQuotationProduct): FormGroup {
    return this.formBuilder.group({
      id: [
        product?.id ?? null
      ],
      quotationsQuoteRequestId: [
        product?.quotationsQuoteRequestId ?? null
      ],
      quoteRequestProductId: [
        product?.quoteRequestProduct?.id ?? null
      ],
      description: [
        product?.quoteRequestProduct?.ipProduct?.description ?? ''
      ],
      mfrReference: [
        product?.quoteRequestProduct?.ipProduct?.mfrReference ?? ''
      ],
      quantity: [
        product?.quoteRequestProduct?.quantity ?? 0
      ],
      unitType: [
        product?.quoteRequestProduct?.unitType ?? ''
      ],
      unitPrice: [
        product?.quoteRequestProduct?.unitPrice ?? 0
      ],
      sellingUnitPrice: [
        product?.sellingUnitPrice ?? 0
      ],
      extendedPrice: [
        product?.extendedPrice ?? 0
      ],
      profitMargin: [
        product?.profitMargin ?? 0
      ],
      condition: [
        product?.condition ?? ''
      ]
    });
  }

  getListProducts(): FormArray {
    return this.formTab.get('products') as FormArray;
  }

  openProduct(productId: string) {
    this.navigateSV.openModuleNewTabAndOpenItem('Products', productId);
  }

  removeProduct(qProduct: {id: string, description: string}) {
    this.utilSV.confirm({
      message: `Are you sure to remove the product ${qProduct.description}?`,
      accept: () => {
        this._loading.set(true);
        this.quotetationSV.removeQuotationProduct(qProduct.id, this.item()!.id)
        .subscribe({
          next: (resp) => {
            this.tabItem.pristine = false;
            this.onSubmit();
          },
          error: (err) => {
            this.utilSV.setMessage(TITLES.error, err, 'error');
            this._loading.set(false);
          },
        });
      }
    })
  }

  removeQuoteRequest(qr: {qqrId?: string, number?: string}) {
    if (!qr.qqrId) return;
    this.utilSV.confirm({
      message: MESSAGES.removeQrFromQuotation(qr.number ?? ''),
      header: TITLES.confirmation,
      accept: () => {
        this._loading.set(true);
        this.quotetationSV.removeQuoteRequestFromQuotation(this.item()!.id, qr.qqrId!)
        .subscribe({
          next: (resp) => {
            this.utilSV.setMessage(resp.title, resp.message, 'success');
            this.tabItem.pristine = false;
            this.onSubmit();
          },
          error: (err) => {
            this.utilSV.setMessage(TITLES.error, err, 'error');
            this._loading.set(false);
          },
        });
      }
    });
  }

  openModalProduct(type: 'create' | 'edit', productId?: string) {
    if (this.tabItem.type !== 'edit') return;
    let modal =  this.dialogSV.open(QuotationProductModalComponent,{
      header: `${(type === 'edit'? 'UPDATE' : 'ADD')} PRODUCT` ,
      width: '70rem',
      closable: false,
      closeOnEscape: false,
      data: {
        type,
        productId,
        qId: this.item()?.id,
        listQuoteRequests: this.item()?.listQuoteRequests ?? []
      }
    });
    modal.onClose.subscribe({
      next: (resp: {valid: boolean}) => {
        if (resp && resp.valid) {
          this.tabItem.pristine = false;
          this.onSubmit();
        }
      }
    });
  }

  cloneQ() {
    const qNumber = this.tabItem.item.name;
    this.utilSV.confirm({
      message: MESSAGES.clone(qNumber),
      header: TITLES.confirmation,
      accept: () => {
        this._loading.set(true);
        this.showForm = false;
        this.quotetationSV.cloneQuotation(this.tabItem.item.id)
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
            this.utilSV.setMessage(resp.title, resp.message, 'success');
            this.opened.emit({
              item: {
                id: resp.data.id,
                name: resp.data.number,
                status: resp.data.status
              },
              type: 'edit',
              pristine: true
            });
          },
          error: (err) => {
            this.utilSV.setMessage(TITLES.error, err, 'error');
          }
        });
      }
    });
  }

  openModalAddQuoteRequests() {
    if (this.tabItem.type !== 'edit') return;
    if (!this.item()) return;

    const modal = this.dialogSV.open(AddQuoteRequestsModalComponent, {
      header: 'ADD QUOTE REQUESTS TO QUOTATION',
      width: '60rem',
      closable: false,
      closeOnEscape: false,
      data: {
        qId: this.item()!.id,
        clientId: this.item()!.client.id,
        currency: this.item()!.currency,
        listAddQR: this.item()!.listQuoteRequests
      }
    });
    modal.onClose.subscribe({
      next: (resp: { valid: boolean; quotation?: IpQuotation }) => {
        if (resp && resp.valid) {
          this.tabItem.pristine = false;
          this.onSubmit();
        }
      }
    });
  }

  openModalListOtherCharges() {
    if (!this.item()) return;

    const modal = this.dialogSV.open(ListOtherChargesModalComponent, {
      header: 'OTHER CHARGES',
      width: '70rem',
      closable: false,
      closeOnEscape: false,
      data: {
        qId: this.item()!.id,
        type: this.tabItem.type === 'edit' ? 'edit' : 'view',
        currency: this.item()!.currency,
        otherCharges: this.item()!.otherCharges || []
      }
    });
    modal.onClose.subscribe({
      next: (resp: { valid: boolean }) => {
        if (resp && resp.valid) {
          this.tabItem.pristine = false;
          this.onSubmit();
        }
      }
    });
  }

  printQR() {
    // TODO FASE 8: Implement print functionality with Jasper templates
    this.utilSV.setMessage(TITLES.info, 'Print functionality coming in FASE 8', 'info');
  }

  printAndSendQR() {
    // TODO FASE 8: Implement print and send functionality
    this.utilSV.setMessage(TITLES.info, 'Print & Send functionality coming in FASE 8', 'info');
  }
}
