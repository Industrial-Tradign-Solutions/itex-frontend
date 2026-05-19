import { Component, computed, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { Messages, TitlesMessages } from '@config/messages';
import { CommonPageTab } from '@config/tabs/commonPageTab';
import { EmitedTab } from '@config/types/tabs';
import { IpQuoteRequest, IpQuoteRequestProduct, IpQuoteRequestRequest, ListIpQuoteRequest, mapToIpQrRequest } from '@interfaces/ip/quoteRequest';
import { IpQuoteRequestPermissions } from '@pages/principal/ip/quote-request/quote-request.component';
import { environment } from '../../../../../environments/environment';
import { IpQuoteRequestService } from '@services/ip';
import { StaticListItem } from '@interfaces/static-list.model';
import { FormArray, FormGroup, Validators } from '@angular/forms';
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
import { QuoteRequestProductModalComponent } from '@modals/ip/qr/quote-request-product-modal/quote-request-product-modal.component';
import { ListOtherChargesModalComponent } from '@modals/ip/qr/list-other-charges-modal/list-other-charges-modal.component';

const MESSAGES = Messages.pages.ip.quoteRequest;
const TITLES = TitlesMessages;
const TIMEOUT = environment.timeout;
@Component({
  selector: 'app-form-ip-quote-request',
  templateUrl: './form-ip-quote-request.component.html',
  styleUrl: './form-ip-quote-request.component.scss'
})
export class FormIpQuoteRequestComponent extends CommonPageTab<ListIpQuoteRequest, IpQuoteRequestPermissions, IpQuoteRequest> implements OnInit  {

  @Output() opened = new EventEmitter<EmitedTab<ListIpQuoteRequest>>();

  //! Inyecciones
  private quoteRequestSV      = inject(IpQuoteRequestService);
  private clientSV            = inject(ClientsService);
  private supplierSV          = inject(SuppliersService);
  private userSV              = inject(UsersService);
  private storageSV           = inject(StorageService);
  private navigateSV          = inject(NavigateTabsService);
  private emailSV             = inject(EmailService);
  //! _________________________________________________________________
  //* Señales
  listIpQuoteRequestStatus = computed<StaticListItem[]>(() => this.staticListSV.getListIpQuoteRequestStatus());
  listCurrency = computed<StaticListItem[]>(() => this.staticListSV.getListCurrency());
  listFreightClass = computed<StaticListItem[]>(() => this.staticListSV.getListFreightClass());
  listPaymenTerms = computed<StaticListItem[]>(() => this.staticListSV.getListPaymentTerms());
  private _listEmployees = signal<BasicUser[]>([]);
  listEmployees = computed<BasicUser[]>(() => this._listEmployees());

  private _listSupplierContact = signal<SupplierContact[]>([]);
  listSupplierContact = computed<SupplierContact[]>(() => this._listSupplierContact());
  private _listClientContact = signal<ClientContact[]>([]);
  listClientContact = computed<ClientContact[]>(() => this._listClientContact());

  private userData = computed<UserInfo | null>(() => this.storageSV.getPlain<UserInfo>(storageKeys.user_data.info))
  //* -----------------------------------------------------------
  //? Variables
  //?------------------------------------------------------------
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
      updatePermission: this.permissions().updateIpQuoteRequest,
      openAndLock: this.quoteRequestSV.openAndLockQuoteRequest(this.tabItem.item.id, this.tabItem.type),
      module: 'QR'
    });
  }

  openQuoteRequest(quoteRequest: ListIpQuoteRequest ) {
    this.opened.emit({
      type: this.permissions().updateIpQuoteRequest ? 'edit' : 'view',
      item: quoteRequest,
      pristine: true
    });
  }

  openQuotation( quotation: {id: string, number: string}) {
    this.navigateSV.openModuleNewTabAndOpenItem('Quotations', quotation.id);
  }

  cloneQr() {
    if (this.tabItem.type === 'create') return;
    this.utilSV.confirm({
      message: MESSAGES.clone(this.item()!.number),
      accept: () => {
        this._loading.set(true);
        this.showForm = false;
        this.quoteRequestSV.cloneQuoteRequest(this.item()!.id)
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
            this._item()?.clonedQrs.push(resp.data);
            this.utilSV.setMessage(resp.title, resp.message, 'success');
            this.opened.emit({
              type: this.permissions().updateIpQuoteRequest ? 'edit' : 'view',
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

  openProduct(productId: string) {
    this.navigateSV.openModuleNewTabAndOpenItem('Products', productId);
  }

  removeProduct(qrProduct: {id: string, description: string}) {
    this.utilSV.confirm({
      message: MESSAGES.removeProduct(qrProduct.description),
      accept: () => {
        this._loading.set(true);
        this.quoteRequestSV.removeQuoteRequestProduct(qrProduct.id, this.item()!.id)
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

  printQR() {
    this.downloadFile(this.quoteRequestSV.printQuoteRequest(this.item()!.id), this.item()!.number);
  }

  printAndSendQR() {
    if (this.item()!.products.length <= 0 || !this.item()?.supplier){
      this.formTab.patchValue({ status: this.item()!.status });
      return;
    }
    this._loadingPrintAndSent.set(true);
    this.quoteRequestSV.printQuoteRequest(this.item()!.id)
    .pipe(finalize(() => {
      setTimeout(() => {
        this._loadingPrintAndSent.set(false);
      }, TIMEOUT);
    }))
    .subscribe({
      next: (file) => {
        this.emailSV.openModalEmail({
          tittle: `SEND QUOTE REQUEST ${this.item()!.number}`,
          subjectTemplate: `Request for quotation`,
          bodyTemplate: emailBodyTemplates.ip_quote_request(this.item()!.supplierContact?.name),
          toTemplate: this.item()!.supplierContact?.email ? [ this.item()!.supplierContact?.email ] : [],
          attachmentsTemplate: [
            {
              name: `${this.item()!.number}.pdf`,
              data: file
            }
          ]
        }).onClose.subscribe({
          next: (modal) => {
            if (modal.valid && this.item()?.status === 'CREATED') {
              this.executeChangeStatus(this.quoteRequestSV.changeStatusQuoteRequest(this.item()!.id, 'SENT'), 'SENT')
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
    const qrId = this.tabItem.item.id;
    const qrNumber = this.tabItem.item.name;

    const actions: Record<string, () => void> = {
      CREATED: () => this.handleChangeStatus(
        MESSAGES.changeStatus(qrNumber, 'CREATED'),
        () => this.quoteRequestSV.changeStatusQuoteRequest(qrId, 'CREATED'),
        'CREATED'
      ),
      //SENT: () => this.printAndSendQR(),
      SENT: () => this.handleChangeStatus(
        MESSAGES.changeStatus(qrNumber, 'SENT'),
        () => this.quoteRequestSV.changeStatusQuoteRequest(qrId, 'SENT'),
        'SENT'
      ),
      ANSWERED: () => this.handleChangeStatus(
        MESSAGES.changeStatus(qrNumber, 'ANSWERED'),
        () => this.quoteRequestSV.changeStatusQuoteRequest(qrId, 'ANSWERED'),
        'ANSWERED'
      ),
      COMPLETE: () => this.handleChangeStatus(
        MESSAGES.changeStatus(qrNumber, 'COMPLETE'),
        () => this.quoteRequestSV.changeStatusQuoteRequest(qrId, 'COMPLETE'),
        'COMPLETE'
      ),
      REJECTED: () => this.handleChangeStatus(
        MESSAGES.changeStatus(qrNumber, 'REJECTED'),
        () => this.quoteRequestSV.rejectQuoteRequest(qrId),
        'REJECTED'
      ),
    };
    actions[event.value]?.();
  }

  private handleChangeStatus(
    message: string,
    action: () => Observable<MessageResponse<ListIpQuoteRequest>>,
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

  private executeChangeStatus(action: Observable<MessageResponse<ListIpQuoteRequest>>, newStatus:  'CREATED' | 'ANSWERED' | 'SENT' | 'COMPLETE' | 'REJECTED'){
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
        } else  if (newStatus === 'ANSWERED') {
          this.item()!.answeredAt = new Date().toISOString();
        } else  if (newStatus === 'REJECTED') {
          this.item()!.rejectAt = new Date().toISOString();
        } else  if (newStatus === 'COMPLETE') {
          this.item()!.completeAt = new Date().toISOString();
        }
      },
      error: (err) => {
        this.rejectStatusChange(err);
      }
    });
  }

  openHistory(quoteRequest: IpQuoteRequest) {

  }

  openModalProduct(type: 'create' | 'edit', productId?: string) {
    if (this.tabItem.type !== 'edit') return;
    let modal =  this.dialogSV.open(QuoteRequestProductModalComponent,{
      header: `${(type === 'edit'? 'UPDATE' : 'ADD')} PRODUCT` ,
      width: '70rem',
      closable: false,
      closeOnEscape: false,
      data: {
        type,
        productId,
        qrId: this.item()?.id,
        currency: this.getCurrency()
      }
    });
    modal.onClose.subscribe({
      next: (resp: {valid: boolean}) => {
        if (resp.valid) {
          this.tabItem.pristine = false;
          this.onSubmit();
        }
      }
    });
  }

  openModalListOtherCharges() {
    if (this.tabItem.type === 'create') return;
    let modal =  this.dialogSV.open(ListOtherChargesModalComponent,{
      header: `LIST OTHER CHARGES` ,
      width: '50rem',
      closable: false,
      closeOnEscape: false,
      data: {
        type: this.tabItem.type,
        qrId: this.item()?.id,
        currency: this.getCurrency(),
        otherCharges: this.item()?.otherCharges
      }
    });
    modal.onClose.subscribe({
      next: (resp: {valid: boolean}) => {
        if (resp.valid) {
          this.tabItem.pristine = false;
          this.onSubmit();
        }
      }
    });
  }

  protected override getRequest() {
    const formValue = this.formTab.value;

    const supplierId = formValue.supplierId || this.item()?.supplier?.id;

    const data = { ...formValue, supplierId };
    return mapToIpQrRequest(data);
  }
  protected override buildFormAction(): void {
    this.formTab = this.formBuilder.group({
      currency: [
        this.item()?.currency ?? 'USD',
        [
          Validators.required
        ]
      ],
      clientId: [
        this.item()?.client?.id ?? null,
        [
          Validators.required
        ]
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
        this.item()?.clientQrNumber ?? null,
        []
      ],
      supplierId: [
        this.item()?.supplier?.id ?? null,
        [
          Validators.required
        ]
      ],
      supplierAddress: [
        this.item()?.supplier?.address ?? null,
        []
      ],
      supplierContactId: [
        this.item()?.supplierContact?.id ?? null,
        []
      ],
      supplierQrNumber: [
        this.item()?.supplierQrNumber ?? null,
        []
      ],
      salesRepId: [
        this.item()?.salesRep?.id ?? this.userData()?.id,
        [
          Validators.required
        ]
      ],
      remarks: [
        this.item()?.remarks ?? null,
        []
      ],
      internalRemarks: [
        this.item()?.internalRemarks ?? null,
        []
      ],
      shippingPointZipCode: [
        this.item()?.shippingPointZipCode ?? null,
        []
      ],
      freightClass: [
        this.item()?.freightClass ?? null,
        []
      ],
      fobShippingPoint: [
        this.item()?.fobShippingPoint ?? null,
        []
      ],
      paymentTerms: [
        this.item()?.paymentTerms ?? null,
        []
      ],
      freightCharges: [
        this.item()?.freightCharges ?? null,
        []
      ],
      total: [
        this.item()?.total ?? 0,
        []
      ],
      subTotal: [
        this.item()?.subTotal ?? 0,
        []
      ],
      status: [
        this.item()?.status ?? 'CREATED',
        [
          Validators.required
        ]
      ],
      products: this.getProducts(this.item()?.products),
      grossWeightLbs: [
        this.item()?.grossWeightLbs ?? 0,
      ],
      otherCharges: [
        this.item()?.totalOtherCharges ?? 0,
      ]
    });
  }
  private getProducts(products?: IpQuoteRequestProduct[]): FormArray {
    if (products && products.length > 0)  {
      return this.formBuilder.array(
        products.map( product => this.formProduct(product))
      );
    } else {
      return this.formBuilder.array([]);
    }
  }

  private formProduct(product?: IpQuoteRequestProduct): FormGroup {
    return this.formBuilder.group({
      id: [
        product?.id ?? null
      ],
      ipProductId: [
        product?.ipProduct?.id ?? null
      ],
      mfrReference: [
        product?.ipProduct?.mfrReference  ?? '',
      ],
      clientReference: [
        product?.ipProduct?.clientReference ?? '',
      ],
      description: [
        product?.ipProduct?.description ?? '',
      ],
      clientDescription: [
        product?.ipProduct?.clientDescription ?? '',
      ],
      quantity: [
        product?.quantity ?? 0
      ],
      type: [
        product?.unitType ? product!.unitType.replace('_', ' ') : ''
      ],
      hts: [
        product?.ipProduct?.htsScheduleBNumber ?? ''
      ],
      dualUse: [
        product?.ipProduct?.dualUse ?? false
      ],
      eccn: [
        product?.ipProduct?.eccn ?? ''
      ],
      leadTime: [
        product?.leadTime ?? 0
      ],
      leadTimeType: [
        product?.leadTimeType ?? 'WEEKS'
      ],
      unitPrice: [
        product?.unitPrice ?? 0
      ],
      extendedPrice: [
        product?.extendedPrice ?? 0
      ]
    });
  }

  getListProducts(): FormArray {
    return this.formTab.get('products') as FormArray;
  }

  getRemarksSize(): number {
    let resp = 4;

    this._item()!.listQuotations = [{}]

    if (this.item()?.clonedQrs === undefined || this.item()?.clonedQrs === null ||  this.item()!.clonedQrs.length === 0) {
      resp = resp + 4;
    }

    if (this.item()?.listQuotations === undefined || this.item()?.listQuotations === null ||  this.item()!.listQuotations.length === 0) {
      resp = resp + 4;
    }

    return resp;
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
    if (type === 'edit' && perms.updateIpQuoteRequest) {
      controls['status'].enable();
    }

    // 🔹 Configurar lista de empleados
    const employees = this.userSV.listEmployees();
    this._listEmployees.set(employees);
    if (item?.salesRep && !employees.some(e => e.id === item.salesRep.id)) {
      this._listEmployees().push(item.salesRep);
    }

    // 🔹 Deshabilitar campos base
    ['supplierContactId', 'clientContactId'].forEach(id => controls[id].disable());

    // 🔹 Configuración según tipo
    if (type === 'create') {
      controls['salesRepId'].disable();
    } else if (item) {
      if (item.supplier) {
        controls['supplierContactId'].enable();
        this.assignListSupplierContact(item.supplier.infoByDepartment);
      }
      if (item.client) {
        controls['clientContactId'].enable();
        this.assignListClientContact(item.client.infoByDepartment);
      }
    }

    // 🔹 Deshabilitar campos con permisos limitados
    if (!perms.editPaymentTermsIpQuoteRequest) {
      controls['paymentTerms'].disable();
    }

    // 🔹 Deshabilitar campos de solo lectura
    [
      'clientAddress',
      'supplierAddress',
      'grossWeightLbs',
      'subTotal',
      'otherCharges',
      'total'
    ].forEach(field => controls[field].disable());

    // 🔹 Mostrar formulario y cargar datos
    this.showForm = true;
    this.searchSupplier({ query: '', originalEvent: new Event('') });
    this.searchClient({ query: '', originalEvent: new Event('') });

    if (item?.listQuotations && item.listQuotations.length > 0) {
      controls['clientId'].disable();
      controls['currency'].disable();
    }

    if (item?.status === 'ANSWERED') {
      controls['supplierId'].disable();
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
      updatePermission: this.permissions().updateIpQuoteRequest,
      action: this.getSubmitAction()
    });
  }

  private getSubmitAction(): Observable<MessageResponse<IpQuoteRequest>> {
    let data: IpQuoteRequestRequest = this.getRequest();
    if (this.tabItem.type === 'create') {
      return this.quoteRequestSV.createQuoteRequest(data);
    } else if (this.tabItem.type === 'edit') {
      return this.quoteRequestSV.updateQuoteRequest(this.tabItem.item.id, data);
    } else {
      throw Error;
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

  clearClient(event: any) {
    this.formTab.patchValue({
      clientContactId: null,
      clientAddress: null
    });
    this._listClientContact.set([]);
    this.formTab.controls['clientContactId'].disable();
  }

  private assignListClientContact(infoByDepartment: ClientInfoDep[]) {
    let cloneDepInfo = this.clone<ClientInfoDep[]>(infoByDepartment);
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
    this.formTab.controls['paymentTerms'].enable();
    this.formTab.patchValue({
      supplierContactId: null,
      supplierAddress: event.value.address,
      paymentTerms: event.value.paymentTerms
    });
    this.assignListSupplierContact(event.value.infoByDepartment);
    if (!this.permissions().editPaymentTermsIpQuoteRequest) {
      this.formTab.controls['paymentTerms'].disable();
    }
  }

  clearSupplier(event: any) {
    this.formTab.patchValue({ supplierContactId: null });
    this._listSupplierContact.set([]);
    this.formTab.controls['supplierContactId'].disable();
    this.formTab.patchValue({
      paymentTerms: null,
      supplierAddress: null,
    });
  }

  private assignListSupplierContact(infoByDepartment: SupplierInfoDep[]) {
    let cloneDepInfo = this.clone<SupplierInfoDep[]>(infoByDepartment);
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
