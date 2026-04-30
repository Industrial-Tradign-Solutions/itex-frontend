import { Component, computed, EventEmitter, inject, Input, OnInit, Output, signal, Signal } from '@angular/core';
import { finalize, Observable } from 'rxjs';
import { StaticListsService, UtilService } from '@services/util';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CityService, DepartmentService, IndustriesService } from '@services/masters';
import { StaticListItem } from '@interfaces/static-list.model';
import { BasicIndustry } from '@interfaces/masters/industries';
import { BasicDepartment } from '@interfaces/masters/departments';
import { ClientPermissions } from '@pages/principal/partners/clients/clients.component';
import { UsersService } from '@services/admin';
import { BasicUser } from '@interfaces/administration/user';
import { MessageResponse } from '@interfaces/message-response';
import { Client, ClientContact, ClientContactPhone, ClientInfoDep, ListClients } from '@interfaces/partners/clients';
import { BasicCity } from '@interfaces/masters/locations/cities';
import { environment } from '../../../../../environments/environment';
import { AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { DialogService } from 'primeng/dynamicdialog';
import { ContactModalComponent } from '@modals/partners/contact-modal/contact-modal.component';
import { EmitedTab } from '@config/types/tabs';
import { ClientsService } from '@services/partners';
import { Messages, TitlesMessages } from '@config/messages';


const TIMEOUT = environment.timeout;
const MESSAGES = Messages.pages.partners;
const TITLES = TitlesMessages;

@Component({
  selector: 'app-form-client-prospect',
  templateUrl: './form-client-prospect.component.html',
  styleUrl: './form-client-prospect.component.scss'
})
export class FormClientProspectComponent implements OnInit {

  //? Outputs
  @Output() onCloseClientProspect = new EventEmitter<{index: number}>();
  //?------------------------------------------------------------------
  //*Inputs
  @Input() permissionsClient!: Signal<ClientPermissions>;
  @Input({required: true}) tabItem!: EmitedTab<ListClients>;
  @Input({required: true}) index!: number;
  //*------------------------------------------------------------------
  //! Inyecciones
  private clientSV       = inject(ClientsService);
  private utilSV         = inject(UtilService);
  private formBuilder    = inject(FormBuilder);
  private staticListSV   = inject(StaticListsService);
  private industriesSV   = inject(IndustriesService);
  private citiesSV       = inject(CityService);
  private departmentsSV  = inject(DepartmentService);
  private userSV         = inject(UsersService);
  private dialogSV       = inject(DialogService);
  //! _________________________________________________________________
  //* Señales
  listClientStatus = computed<StaticListItem[]>(() => this.staticListSV.getListClientStatus());
  listLanguaje = computed<StaticListItem[]>(() => this.staticListSV.getListLanguages());
  listPaymentMethods = computed<StaticListItem[]>(() => this.staticListSV.getListPaymentMethods());
  listPaymentTerms = computed<StaticListItem[]>(() => this.staticListSV.getListPaymentTerms());
  private _client = signal<Client | undefined>(undefined);
  client = computed<Client | undefined>(() => this._client());
  private _listDepartmentsInfo = signal<BasicDepartment[]>([]);
  listDepartmentsInfo = computed<BasicDepartment[]>(() => this._listDepartmentsInfo());
  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());
  private _isValidOpen = signal<boolean>(true);
  isValidOpen = computed<boolean>(() => this._isValidOpen());
  //*___________________________________________________________________
  //? Variables
  formClient!: FormGroup;
  errors: string[] = [];
  showForm = false;
  viewRequired = false;
  animation = 'fadeIn';
  //?------------------------------------------------------------

  constructor() {
    this.loadCities();
    this.loadDepartments();
  }

  ngOnInit(): void {
    this._loading.set(true);
    if (this.tabItem.type !== 'create') {
      if (!this.permissionsClient().updateClient) {
        this.tabItem.type = 'view';
      }
      this.clientSV.openAndLockClient(this.tabItem.item.id, this.tabItem.type).subscribe({
        next: resp => {
          setTimeout(() => {
            if (!resp.isValidOpen) {
              this.tabItem.type = 'view';
              this.utilSV.confirm({
                message: MESSAGES.openBy('client', resp.data.name, resp.data.openBy.fullName),
                acceptLabel: 'Ok',
                rejectVisible: false
              });
            }
            this._client.set(resp.data);
            this._isValidOpen.set(resp.isValidOpen);
            this.tabItem.item.name = resp.data.name;
            this.tabItem.item.code = resp.data.code;
            this.buildForm();
            this._loading.set(false);
          }, TIMEOUT);
        }, error: err => {
          this.utilSV.setMessage('Warning', err, 'warn')
          this.onCloseClientProspect.emit({index: this.index + 1});
          this._loading.set(false);
        }
      });
    } else {
      setTimeout(() => {
        this.buildForm();
        this._loading.set(false);
      }, TIMEOUT);
    }
  }

  private buildForm() {
    this.loadIndustries();
    this.loadEmployees();

    this.formClient = this.formBuilder.group({
      name: [
        this.client()?.name ?? null,
        [
          Validators.required
        ]
      ],
      address: [
        this.client()?.address ?? null,
        []
      ],
      cityId: [
        this.client()?.city?.id ?? null,
        []
      ],
      countryName: [
        this.client()?.city?.state?.country?.name ?? null,
        []
      ],
      stateName: [
        this.client()?.city?.state?.name ?? null,
        []
      ],
      industryId: [
        this.client()?.industry?.id ?? null,
        []
      ],
      notes: [
        this.client()?.notes ?? null
      ],
      status: [
        this.client()?.status ?? 'PROSPECT',
        [
          Validators.required
        ]
      ],
      code: [
        this.client()?.code ?? null,
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(4)
        ]
      ],
      taxId: [
        this.client()?.taxId ?? null,
        []
      ],
      language: [
        this.client()?.language ?? 'ENGLISH',
        [
          Validators.required
        ]
      ],
      paymentTerms: [
        this.client()?.paymentTerms ?? null,
        []
      ],
      paymentMethod: [
        this.client()?.paymentMethod ?? 'WIRE_TRANSFER',
        [
          Validators.required
        ]
      ],
      webSite: [
        this.client()?.webSite ?? null,
        []
      ],
      zipCode: [
        this.client()?.zipCode ?? null,
        []
      ],
      countryCode: [
        this.client()?.countryCode ?? null,
        []
      ],
      cityCode: [
        this.client()?.cityCode ?? null,
        []
      ],
      phoneNumber: [
        this.client()?.phoneNumber ?? null,
        []
      ],
      infoByDepartment: this.configurreInfoByDep(this.client()?.infoByDepartment),
    });

    this.tabItem.pristine = true;
    if (this.tabItem.type !== 'view') {
      const sub = this.formClient.valueChanges.subscribe({
        next: () => {
          if (!this.tabItem.pristine) {
            sub.unsubscribe();
          } else {
            this.tabItem.pristine = this.formClient.pristine;
          }
        }
      });
    }
    this.enableForm();
    this.changStatus();
  }

  changStatus(change?: boolean) {
    if (this.formClient.value['status'] === 'ACTIVE') {
      this.viewRequired = true;
    }else {
      this.viewRequired = false;
    }

    if (this.tabItem.item.status === 'INACTIVE' && change) {
      this.utilSV.confirm({
        message: MESSAGES.activate_partnert('client'),
        rejectVisible: false,
        acceptLabel: 'OK'
      });
    }
  }

  private configurreInfoByDep(infoByDepartment: ClientInfoDep[] | undefined): FormArray {
    return this.formBuilder.array(
      this.listDepartmentsInfo().map(dep => {
        const infoDep = infoByDepartment ? infoByDepartment.find(info => info.department.id === dep.id) : undefined;
        return this.formBuilder.group({
          id: [
            infoDep?.id ?? null
          ],
          accountRepId: [
            infoDep?.accountRep?.id ?? null
          ],
          departmentId: [
            dep.id,
            [
              Validators.required
            ]
          ],
          target: [
            infoDep?.target ?? 0.000,
            [
              Validators.required,
              Validators.min(0.000)
            ]
          ],
          notes: [
            infoDep?.notes ?? null
          ],
          listContacts: this.configureListContacts(infoDep?.listContacts),
          departmentName: [
            dep.name
          ]
        });
      })
    );
  }

  private configureListContacts(listContacts : ClientContact[] | undefined): FormArray {
    if (listContacts && listContacts.length > 0) {
       return this.formBuilder.array(
         listContacts.map(contact => this.formContact(contact))
       );
    } else {
      return this.formBuilder.array([]);
    }
  }

  private formContact(contact?: ClientContact) : FormGroup {
    return this.formBuilder.group({
      localId: [
        Math.floor(new Date().getTime() / Math.random())
      ],
      id: [
        contact?.id ?? null
      ],
      name: [
        contact?.name ?? null,
        [
          Validators.required
        ]
      ],
      title: [
        contact?.title ?? null
      ],
      email: [
        contact?.email ?? null
      ],
      validMain: [
        contact?.validMain ?? false,
        [
          Validators.required
        ]
      ],
      mainPhone: [
        contact?.mainPhone ?? null
      ],
      active: [
        contact?.active ?? null
      ],
      listPhones: this.configureListPhones(contact?.listPhones)
    });
  }

  private configureListPhones(listPhones: ClientContactPhone[] | undefined): FormArray {
    if (listPhones && listPhones.length > 0) {
      return this.formBuilder.array(
        listPhones.map(phone => this.formPhone(phone))
      );
    } else {
      return this.formBuilder.array([]);
    }
  }

  private formPhone(phone?: ClientContactPhone) : FormGroup {
    return this.formBuilder.group({
      id: [
        phone?.id ?? null
      ],
      type: [
        phone?.type ?? 'OFFICE1',
        [
          Validators.required
        ]
      ],
      countryCode: [
        phone?.countryCode ?? null
      ],
      cityCode: [
        phone?.cityCode ?? null
      ],
      phoneNumber: [
        phone?.phoneNumber ?? null
      ],
      ext: [
        phone?.ext ?? null
      ],
      validMain: [
        phone?.validMain ?? false,
        [
          Validators.required
        ]
      ],
    });
  }

  private enableForm() {
    this.formClient.enable();
    this.formClient.controls['status'].disable();
    this.formClient.controls['stateName'].disable();
    this.formClient.controls['countryName'].disable();

    if (this.tabItem.type === 'edit') {
      if (this.permissionsClient().changeStatusClient) {
        this.formClient.controls['status'].enable();
      }
    }

    if (this.tabItem.type === 'view') {
      this.formClient.disable();
    } else {
      if (!this.permissionsClient().changeTargetClientInfo) {
        this.infoByDepartment.controls.forEach(item => {
          item.get('target')?.disable();
        });
      }
    }
    this.showForm = true;
    this.searchCity({query: ``, originalEvent: new Event('')})
  }

  get infoByDepartment(): FormArray {
    return this.formClient.get('infoByDepartment') as FormArray;
  }

  getlistContact(depIndex: number): FormArray {
    return this.infoByDepartment.at(depIndex).get('listContacts') as FormArray;
  }

  showModalClientContact(type: 'create' | 'edit' | 'view', depIndex: number, contactIndex?: number) {
    this.tabItem.pristine = false;
    let contact: ClientContact | undefined = undefined;
    if ((type === 'edit' || type === 'view') && contactIndex !== undefined) {
      contact = this.getlistContact(depIndex).controls[contactIndex].value;
    }
    let modal =  this.dialogSV.open(ContactModalComponent,{
      header: `${(type === 'edit'? 'UPDATE' : (type === 'view' ? 'VIEW' : 'CREATE'))} CONTACT` ,
      width: '83rem',
      closable: false,
      closeOnEscape: false,
      data: {
        type,
        contact
      }
    });
    modal.onClose.subscribe({
      next: (resp: {contact: ClientContact}) => {
        if (resp && resp.contact) {
          if (type === 'create') {
            const items: ClientContact[] = JSON.parse(JSON.stringify(this.getlistContact(depIndex).value));
            if (this.getlistContact(depIndex).length === 0 || items.every(item=> item.active=== false)) {
              resp.contact.validMain = true;
            }
            this.getlistContact(depIndex).push(
              this.formContact({...resp.contact, active: true})
            );
            contactIndex = this.getlistContact(depIndex).length - 1;
          } else if (type === 'edit') {
            if (contactIndex !== undefined) {
              let form = this.getlistContact(depIndex).controls[contactIndex];
              form.get('name')?.setValue(resp.contact.name);
              form.get('title')?.setValue(resp.contact.title);
              form.get('email')?.setValue(resp.contact.email);
              form.get('mainPhone')?.setValue(resp.contact.mainPhone);

              while (this.getPhones(depIndex, contactIndex).length !== 0) {
                this.getPhones(depIndex, contactIndex).removeAt(0);
              }

              for (let phone of resp.contact.listPhones) {
                this.getPhones(depIndex, contactIndex).push(this.formPhone(phone));
              }

              if (!contact?.validMain) {
                form.get('validMain')?.setValue(resp.contact.validMain);
              } else {
                resp.contact.validMain = true;
              }
            }
          }
          setTimeout(() => {
            if (resp.contact.validMain) {
              this.changeAllContacts(depIndex, contactIndex ?? 0)
            }
          }, 50);
        }
      }
    });
  }

  getPhones(depIndex: number, contactIndex: number): FormArray {
    return this.getlistContact(depIndex).at(contactIndex).get('listPhones') as FormArray;
  }

  private changeAllContacts(depIndex: number, contactIndex: number) {
    let contacts = this.getlistContact(depIndex);
    let index = 0;
    contacts.controls.forEach((contact) => {
      setTimeout(() => {
        if (index !== contactIndex) {
          let item = contact.get('validMain');
          if (item) {
            item.setValue(false);
          }
        }
        index++;
      }, 50);
    });
  }

  disableClientContact(depIndex: number, contactIndex: number) {
    this.utilSV.confirm({
      message: MESSAGES.remove_contact,
      accept: () => {
        this.deleteOrDisableClientContactAction(depIndex, contactIndex, 'disable');
      }
    })
  }

  private deleteOrDisableClientContactAction(depIndex: number, contactIndex: number, type: 'disable' | 'delete') {
    const contact: ClientContact = JSON.parse(JSON.stringify(this.getlistContact(depIndex).controls[contactIndex].value));
    if (type === 'disable') {
      this.getlistContact(depIndex).controls[contactIndex].get('active')?.setValue(false);
      this.getlistContact(depIndex).controls[contactIndex].get('validMain')?.setValue(false);
    } else if (type === 'delete') {
      this.getlistContact(depIndex).removeAt(contactIndex);
    }

    this.tabItem.pristine = false;
    if (contact.validMain && this.getlistContact(depIndex).controls.length > 0) {
      let mainContactSelected = false;
      this.getlistContact(depIndex).controls.forEach(item => {
        const contactInt: ClientContact = JSON.parse(JSON.stringify(item.value));
        if (contactInt.active && !mainContactSelected) {
          item.get('validMain')?.setValue(true);
          mainContactSelected = true;
        }
      });
    }
  }


  onSubmit() {
    if(this.tabItem.pristine) return;
    if(this.tabItem.type === 'view') return;

    if (this.formClient.value['cityId'] === null || this.formClient.value['cityId'] === '' || this.formClient.value['address'] === null || this.formClient.value['address'] === '') {
      let fields = [];
      if (this.formClient.value['cityId'] === null || this.formClient.value['cityId'] === '') {
        fields.push('City');
      }
      if (this.formClient.value['address'] === null || this.formClient.value['address'] === '') {
        fields.push('Address');
      }
      this.utilSV.confirm({
        message: MESSAGES.warning_not_city_address(fields),
        header: TITLES.warning,
        acceptLabel: 'Save',
        acceptButtonStyleClass: 'p-button-success',
        acceptIcon: 'pi pi-save',
        rejectLabel: 'Cancel',
        rejectButtonStyleClass: 'p-button-danger',
        accept: () => {
          this.onSubmitAction();
        }
      });
    } else {
      this.onSubmitAction();
    }
  }

  private onSubmitAction() {
    this.animation = 'fadeOut';
    this.errors = [];
    this._loading.set(true);
    this.formClient.disable();
    setTimeout(() => {
      this.getSubmitAction().pipe(
        finalize(() => {
          setTimeout(() => {
            this._loading.set(false);
            this.enableForm();
            this.animation = 'fadeIn';
          }, TIMEOUT);
        })
      ).subscribe({
        next: resp => {
          this.showForm = false;
          setTimeout(() => {
            this.utilSV.setMessage(resp.title, resp.message, 'success');
            this._client.set(resp.data);
            this.tabItem.item.name = resp.data.name;
            this.tabItem.item.id = resp.data.id;
            this.tabItem.item.code = resp.data.code;

            if (this.tabItem.type === 'create') {
              if (this.permissionsClient().updateClient) {
                this.tabItem.type = 'edit';
              } else {
                this.tabItem.type = 'view';
              }
            }

            this.buildForm();
          }, TIMEOUT);
        }, error: err => {
          if (err.formErrors) {
            for (const key in err.formErrors) {
              if (err.formErrors.hasOwnProperty(key)) {
                this.utilSV.setMessage('Error!', err.formErrors[key], 'error');
              }
            }
          } else {
            this.utilSV.setMessage('Error!', err.errorMessage, 'error');
          }
        }
      });
    }, TIMEOUT / 1.5);

  }

  private getSubmitAction(): Observable<MessageResponse<Client>> {
    let data = this.getRequest();
    if (this.errors.length === 0) {
      if (this.tabItem.type === 'create') {
        return this.clientSV.create(data);
      } else if (this.tabItem.type === 'edit') {
        return this.clientSV.update(this.tabItem.item.id, data);
      } else {
        throw Error;
      }
    } else {
      this.errors.forEach(error => {
        this.utilSV.setMessage('Error!', error, 'error');
      });
      throw Error;
    }
  }

  private getRequest(){
    let data = JSON.parse(JSON.stringify(this.formClient.value));
    if (data.cityId) {
      if (!this.utilSV.validateUUID(data.cityId)) {
        data.cityId = undefined;
        this.utilSV.setMessage(TITLES.error, MESSAGES.city_error, 'error');
        this.enableForm();
        this._loading.set(false);
        throw Error;
      }
    }

    data.infoByDepartment.forEach((dep: { departmentName: any; listContacts: any[]}) => {
      dep.listContacts.forEach((contact: {listPhones: any[], name: string, localId: string}) => {
        if (!contact.listPhones ||contact.listPhones.length <= 0) {
          this.errors.push(MESSAGES.contact_error(contact.name));
        }
      });
      delete dep.departmentName;
    });
    return data;
  }

  private loadDepartments() {
    this.departmentsSV.listClientInfoTrue().subscribe({
      next: resp => this._listDepartmentsInfo.set(resp)
    });
  }

  loadEmployees() {
    this.loadEmployeesExec();
  }

  private async loadEmployeesExec() {
    if (!this.client() || !this.client()?.infoByDepartment) {
      this.userSV.loadEmployees(false);
      return;
    }
    let listUsers: BasicUser[] = [];
    const promises = this.client()?.infoByDepartment.map(info => new Promise<void>((resolve) => {
      if (
        info.accountRep && !info.accountRep.active &&
        !listUsers.some(item => item.id === info.accountRep.id) &&
        this.listDepartmentsInfo().some(dep => dep.id === info.department.id)
      ) {
        listUsers.push({
          id: info.accountRep.id,
          fullName: info.accountRep.fullName + ' (DISABLED)',
          active: false,
          role: info.accountRep.role,
          departments: info.accountRep.departments
        });
      }
      resolve();
    })) || [];
    await Promise.all(promises);
    this.userSV.loadEmployees(false, listUsers);
  }

  getListEmployees(depId: string): BasicUser[] {
    return this.userSV.listEmployees().filter(emp => emp.departments.some(dpto => dpto.id === depId));
  }

  loadCities() {
    this.citiesSV.loadCities();
  }

  changeCity(event: AutoCompleteSelectEvent) {
    this.formClient.controls['stateName'].setValue(event.value.state.name);
    this.formClient.controls['countryName'].setValue(event.value.state.country.name);
  }

  get listCities(): Signal<BasicCity[]> {
    return this.citiesSV.listCities;
  }

  get filteredCities(): BasicCity[] {
    return this.citiesSV.filteredCities;
  }

  searchCity(event: AutoCompleteCompleteEvent) {
    this.citiesSV.searchAutoComplete(event);
  }

  loadIndustries() {
    if(this.client() && this.client()?.industry && !this.client()?.industry.active) {
      this.industriesSV.loadIndustries(false, {
        id: this.client()?.industry.id?? '',
        name: this.client()?.industry.name + ' (DISABLED)',
        active: this.client()?.industry.active?? false
      });
    } else {
      this.industriesSV.loadIndustries(false);
    }
  }

  get listIndustries(): Signal<BasicIndustry[]> {
    return this.industriesSV.listIndustries;
  }
}
