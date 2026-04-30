import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { environment } from '../../../../environments/environment';
import { ClientContact, ClientContactPhone } from '@interfaces/partners/clients';
import { StaticListsService, UtilService } from '@services/util';
import { Messages } from '@config/messages';
import { PhonePipe } from '@pipes/phone.pipe';
import { StaticListItem } from '@interfaces/static-list.model';

const TIMEOUT = environment.timeout;
const MESSAGES = Messages.pages.partners;

@Component({
  selector: 'app-contact-modal',
  templateUrl: './contact-modal.component.html',
  styles: `
    .row-main {
      background-color: rgba(61, 151, 69, 0.15) !important;
    }
  `
})
export class ContactModalComponent implements OnInit {
  //! Inyecciones
  private config      = inject(DynamicDialogConfig);
  private ref         = inject(DynamicDialogRef);
  private formBuilder = inject(FormBuilder);
  private utilSV      = inject(UtilService);
  private phonePipe   = inject(PhonePipe);
  private staticListSV= inject(StaticListsService);
  //! -----------------------------------------------

  //* Señales
  listPhoneTypes = computed<StaticListItem[]>(() => this.staticListSV.getListPhoneTypes());
  private _loading = signal<boolean>(true);
  loading = computed<boolean>(() => this._loading());
  private _type = signal<'create' | 'edit' | 'view'>(this.config.data.type);
  type = computed<'create' | 'edit' | 'view'>(() => this._type());
  private _contact = signal<ClientContact>(this.config.data.contact);
  contact = computed<ClientContact>(() => this._contact());
  private _error = signal<string | null>(null);
  error = computed<string | null>(() => this._error());
  //*------------------------------------------------

  formContact!: FormGroup;

  ngOnInit(): void {
    setTimeout(() => {
      this.buildForm();
      this._loading.set(false);
    }, TIMEOUT);
  }

  closeModal() {
    this.ref.close();
  }

  saveAction() {
    this._loading.set(true);
    setTimeout(() => {
      this.phones.controls.forEach(phone => {
        if (phone.get('validMain')?.value === true) {

          let phoneNumer = phone.value;
          if (phoneNumer.phoneNumber && phoneNumer.phoneNumber >= 0) {
            let mainPhone = ``;
            if (phoneNumer.countryCode && phoneNumer.countryCode >= 0) {
              mainPhone += '+' + phoneNumer.countryCode;
            }

            if (phoneNumer.cityCode && phoneNumer.cityCode >= 0) {
              mainPhone += ' (' + phoneNumer.cityCode + ')';
            }

            mainPhone += ' ' + this.phonePipe.transform(phoneNumer.phoneNumber);

            if (phoneNumer.ext && phoneNumer.ext >= 0) {
              mainPhone += ' ext.' + phoneNumer.ext;
            }
            mainPhone += ` - [${phoneNumer.type}]`;
            this.formContact.get('mainPhone')?.setValue(mainPhone);
          } else {
            this.formContact.get('mainPhone')?.setValue(null);
          }
        }
      });
      setTimeout(() => {
        this.ref.close({contact: this.formContact.value});
      }, 60);
    }, TIMEOUT);
  }

  private buildForm() {
    this.formContact = this.formBuilder.group({
      id: [
        this.contact()?.id ?? null
      ],
      name: [
        this.contact()?.name ?? null,
        [
          Validators.required
        ]
      ],
      title: [
        this.contact()?.title ?? null
      ],
      email: [
        this.contact()?.email ?? null,
        [
          Validators.email
        ]
      ],
      validMain: [
        this.contact()?.validMain ?? false,
        [
          Validators.required
        ]
      ],
      mainPhone: [
        this.contact()?.mainPhone ?? null
      ],
      listPhones: this.configureListPhones(this.contact()?.listPhones)
    });

    if (this.contact()?.validMain) {
      this.formContact.controls['validMain'].disable();
    }

    if (this.type() === 'view') {
      this.formContact.disable();
    }

    if (this.type() === 'create') {
      this.newPhone();
    }

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
      localId: [
        Math.floor(new Date().getTime() / Math.random())
      ],
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

  newPhone() {
    this.phones.push(this.formPhone());
    if (this.phones.length === 1) {
      this.phones.controls[0].get('validMain')?.setValue(true);
    }
  }

  deleteClientContactPhone(phoneIndex: number) {
    this.utilSV.confirm({
      message: MESSAGES.remove_contact_phone,
      accept: () => {
        const phone: ClientContactPhone = JSON.parse(JSON.stringify(this.phones.controls[phoneIndex].value));
        this.phones.removeAt(phoneIndex);
        if (phone.validMain) {
          const newMainPhone = this.phones.controls[0].value;
          this.phones.controls[0].get('validMain')?.setValue(true);
          this.setMainPhone(newMainPhone.localId);
        }
      }
    })
  }

  setMainPhone(localId: number) {
    this.phones.controls.forEach(phone => {
      if (phone.get('localId')?.value === localId) {
        phone.get('validMain')?.setValue(true);
      } else {
        phone.get('validMain')?.setValue(false);
      }
    });
  }

  get phones(): FormArray {
    return this.formContact.get('listPhones') as FormArray;
  }
}
