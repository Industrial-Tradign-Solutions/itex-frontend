import { Component, computed, inject, OnInit, signal, Signal } from '@angular/core';
import { ListSuppliers, Supplier, SupplierContact, SupplierContactPhone, SupplierInfoDep } from '@interfaces/partners/suppliers';
import { SupplierPermissions } from '@pages/principal/partners/suppliers/suppliers.component';
import { Messages, TitlesMessages } from '@config/messages';
import { SuppliersService } from '@services/partners';
import { FormArray, FormGroup, Validators } from '@angular/forms';
import { CityService, DepartmentService } from '@services/masters';
import { StaticListItem } from '@interfaces/static-list.model';
import { BasicDepartment } from '@interfaces/masters/departments';
import { ContactModalComponent } from '@modals/partners/contact-modal/contact-modal.component';
import { Observable } from 'rxjs';
import { MessageResponse } from '@interfaces/message-response';
import { AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { BasicCity } from '@interfaces/masters/locations/cities';
import { CommonPageTab } from '@config/tabs/commonPageTab';

const MESSAGES = Messages.pages.partners;
const TITLES = TitlesMessages;

@Component({
  selector: 'app-form-suppliers',
  templateUrl: './form-suppliers.component.html',
  styleUrl: './form-suppliers.component.scss'
})
export class FormSuppliersComponent extends CommonPageTab<ListSuppliers, SupplierPermissions, Supplier>  implements OnInit{

  //! Inyecciones
  private supplierSV     = inject(SuppliersService);
  private citiesSV       = inject(CityService);
  private departmentsSV  = inject(DepartmentService);
  //! _________________________________________________________________
  //* Señales
  listSupplierStatus = computed<StaticListItem[]>(() => this.staticListSV.getListSupplierStatus());
  listLanguaje = computed<StaticListItem[]>(() => this.staticListSV.getListLanguages());
  listPaymentMethods = computed<StaticListItem[]>(() => this.staticListSV.getListPaymentMethods());
  listPaymentTerms = computed<StaticListItem[]>(() => this.staticListSV.getListPaymentTerms());
  private _listDepartmentsInfo = signal<BasicDepartment[]>([]);
  listDepartmentsInfo = computed<BasicDepartment[]>(() => this._listDepartmentsInfo());
  //*___________________________________________________________________

  constructor() {
    super(MESSAGES);
    this.loadCities();
    this.loadDepartments();
  }

  ngOnInit(): void {
    this.onInitAction({
      updatePermission: this.permissions().updateSupplier,
      openAndLock: this.supplierSV.openAndLockSupplier(this.tabItem.item.id, this.tabItem.type),
      module: 'supplier'
    });
  }

  protected buildFormAction() {
    this.formTab = this.formBuilder.group({
      name: [
        this.item()?.name ?? null,
        [
          Validators.required
        ]
      ],
      address: [
        this.item()?.address ?? null,
        []
      ],
      cityId: [
        this.item()?.city?.id ?? null,
        []
      ],
      countryName: [
        this.item()?.city?.state?.country?.name ?? null,
        []
      ],
      stateName: [
        this.item()?.city?.state?.name ?? null,
        []
      ],
      notes: [
        this.item()?.notes ?? null
      ],
      wireAchInstructions: [
        this.item()?.wireAchInstructions ?? null
      ],
      status: [
        this.item()?.status ?? 'ACTIVE',
        [
          Validators.required
        ]
      ],
      taxId: [
        this.item()?.taxId ?? null,
        []
      ],
      language: [
        this.item()?.language ?? 'ENGLISH',
        [
          Validators.required
        ]
      ],
      paymentTerms: [
        this.item()?.paymentTerms ?? null,
        []
      ],
      paymentMethod: [
        this.item()?.paymentMethod ?? 'WIRE_TRANSFER',
        [
          Validators.required
        ]
      ],
      webSite: [
        this.item()?.webSite ?? null,
        []
      ],
      zipCode: [
        this.item()?.zipCode ?? null,
        []
      ],
      countryCode: [
        this.item()?.countryCode ?? null,
        []
      ],
      cityCode: [
        this.item()?.cityCode ?? null,
        []
      ],
      phoneNumber: [
        this.item()?.phoneNumber ?? null,
        []
      ],
      infoByDepartment: this.configurreInfoByDep(this.item()?.infoByDepartment),
    });
  }

  private configurreInfoByDep(infoByDepartment: SupplierInfoDep[] | undefined): FormArray {
    return this.formBuilder.array(
      this.listDepartmentsInfo().map(dep => {
        const infoDep = infoByDepartment ? infoByDepartment.find(info => info.department.id === dep.id) : undefined;
        return this.formBuilder.group({
          id: [
            infoDep?.id ?? null
          ],
          departmentId: [
            dep.id,
            [
              Validators.required
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

  private configureListContacts(listContacts : SupplierContact[] | undefined): FormArray {
    if (listContacts && listContacts.length > 0) {
        return this.formBuilder.array(
          listContacts.map(contact => this.formContact(contact))
        );
    } else {
      return this.formBuilder.array([]);
    }
  }

  private formContact(contact?: SupplierContact) : FormGroup {
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
        contact?.title ?? null,
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

  private configureListPhones(listPhones: SupplierContactPhone[] | undefined): FormArray {
    if (listPhones && listPhones.length > 0) {
      return this.formBuilder.array(
        listPhones.map(phone => this.formPhone(phone))
      );
    } else {
      return this.formBuilder.array([]);
    }
  }

  changStatus(change?: boolean) {
    if (this.tabItem.item.status === 'INACTIVE' && change) {
      this.utilSV.confirm({
        message: MESSAGES.activate_partnert('supplier'),
        rejectVisible: false,
        acceptLabel: 'OK'
      });
    }
  }

  private formPhone(phone?: SupplierContactPhone) : FormGroup {
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

  protected enableForm() {
    this.formTab.enable();
    this.formTab.controls['status'].disable();
    this.formTab.controls['stateName'].disable();
    this.formTab.controls['countryName'].disable();

    if (this.tabItem.type === 'edit') {
      if (this.permissions().changeStatusSupplier) {
        this.formTab.controls['status'].enable();
      }
    }

    if (this.tabItem.type === 'view') {
      this.formTab.disable();
    }
    this.showForm = true;
    this.searchCity({query: ``, originalEvent: new Event('')})
  }

  get infoByDepartment(): FormArray {
    return this.formTab.get('infoByDepartment') as FormArray;
  }

  getlistContact(depIndex: number): FormArray {
    return this.infoByDepartment.at(depIndex).get('listContacts') as FormArray;
  }

  showModalSupplierContact(type: 'create' | 'edit' | 'view', depIndex: number, contactIndex?: number) {
    this.tabItem.pristine = false;
    let contact: SupplierContact | undefined = undefined;
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
      next: (resp: {contact: SupplierContact}) => {
        if (resp && resp.contact) {
          if (type === 'create') {
            const items: SupplierContact[] = JSON.parse(JSON.stringify(this.getlistContact(depIndex).value));
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

  disableSupplierContact(depIndex: number, contactIndex: number) {
    this.utilSV.confirm({
      message: MESSAGES.remove_contact,
      accept: () => {
        this.deleteOrDisableSupplierContactAction(depIndex, contactIndex, 'disable');
      }
    })
  }

  private deleteOrDisableSupplierContactAction(depIndex: number, contactIndex: number, type: 'disable' | 'delete') {
    const contact: SupplierContact = JSON.parse(JSON.stringify(this.getlistContact(depIndex).controls[contactIndex].value));
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
        const contactInt: SupplierContact = JSON.parse(JSON.stringify(item.value));
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

    if (this.formTab.value['cityId'] === null || this.formTab.value['cityId'] === '' || this.formTab.value['address'] === null || this.formTab.value['address'] === '') {
      let fields = [];
      if (this.formTab.value['cityId'] === null || this.formTab.value['cityId'] === '') {
        fields.push('City');
      }
      if (this.formTab.value['address'] === null || this.formTab.value['address'] === '') {
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
          this.onSubmitAction({
            updatePermission: this.permissions().updateSupplier,
            action: this.getSubmitAction()
          });
        }
      });
    } else {
      this.onSubmitAction({
        updatePermission: this.permissions().updateSupplier,
        action: this.getSubmitAction()
      });
    }
  }

  private getSubmitAction(): Observable<MessageResponse<Supplier>> {
    let data = this.getRequest();
    if (this.errors.length === 0) {
      if (this.tabItem.type === 'create') {
        data.status = 'ACTIVE';
        return this.supplierSV.create(data);
      } else if (this.tabItem.type === 'edit') {
        return this.supplierSV.update(this.tabItem.item.id, data);
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


  protected getRequest(){
    let data = JSON.parse(JSON.stringify(this.formTab.value));
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
    this.departmentsSV.listSupplierInfoTrue().subscribe({
      next: resp => this._listDepartmentsInfo.set(resp)
    });
  }

  loadCities() {
    this.citiesSV.loadCities();
  }

  changeCity(event: AutoCompleteSelectEvent) {
    this.formTab.controls['stateName'].setValue(event.value.state.name);
    this.formTab.controls['countryName'].setValue(event.value.state.country.name);
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

}
