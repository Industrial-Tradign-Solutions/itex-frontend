import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { IpQuotationOtherCharge } from '@interfaces/ip/quotation';
import { IpQuotationService } from '@services/ip';
import { UtilService } from '@services/util';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { environment } from '../../../../../environments/environment';
import { Messages, TitlesMessages } from '@config/messages';
import { finalize } from 'rxjs';
import { OtherChargesModalComponent } from '../other-charges-modal/other-charges-modal.component';

const TIMEOUT = environment.timeout;
const MESSAGES = Messages.pages.ip.quotation;
const TITLES = TitlesMessages;

@Component({
  selector: 'app-list-other-charges-modal',
  templateUrl: './list-other-charges-modal.component.html',
  styleUrl: './list-other-charges-modal.component.scss'
})
export class ListOtherChargesModalComponent implements OnInit{

  //! Inyecciones
  private config      = inject(DynamicDialogConfig);
  private ref         = inject(DynamicDialogRef);
  private utilSV      = inject(UtilService);
  private qSV         = inject(IpQuotationService);
  private dialogSV    = inject(DialogService);
  //! -----------------------------------------------

  protected _loading = signal<boolean>(true);
  loading = computed<boolean>(() => this._loading());
  qId = computed<string>(() => this.config.data.qId);
  type = computed<'view' | 'edit'>(() => this.config.data.type);
  currency = computed<string>(() => this.config.data.currency);
  
  // Quotation Other Charges
  private _quotationOtherCharges = signal<IpQuotationOtherCharge[]>(this.config.data.otherCharges || []);
  quotationOtherCharges = computed<IpQuotationOtherCharge[]>(() => this._quotationOtherCharges());

  protected _validClose = signal<boolean>(false);
  validClose = computed<boolean>(() => this._validClose());

  ngOnInit(): void {
    setTimeout(() => {
      // Other charges come from quotation.otherCharges when modal is opened
      this._loading.update(() => false);
    }, TIMEOUT);
  }

  closeModal() {
    this.ref.close({valid: this.validClose()});
  }

  deleteOtherCharge(otherCharge: IpQuotationOtherCharge, index: number) {
    this.utilSV.confirm({
      message: MESSAGES.removeOtherCharge(otherCharge.description, otherCharge.value, this.currency()),
      accept: () => {
        this._loading.set(true);
        this.qSV.removeQuotationOtherCharge(this.qId(), otherCharge.id)
        .pipe(
          finalize(() => {
            setTimeout(() => {
              this._loading.set(false);
            }, TIMEOUT);
          })
        )
        .subscribe({
          next: (resp) => {
            this.utilSV.setMessage(resp.title, resp.message, 'success');
            this._quotationOtherCharges.update(list =>
              list.filter((_, i) => i !== index)
            );
            this._validClose.update(() => true);
          },
          error: (err) => {
            this.utilSV.setMessage(TITLES.error, err, 'error');
          },
        });
      }
    })
  }

  openModalOtherCharges(type: 'edit' | 'create', otherCharge?: IpQuotationOtherCharge, index?: number) {
    let modal =  this.dialogSV.open(OtherChargesModalComponent,{
      header: `OTHER CHARGES` ,
      width: '30rem',
      closable: false,
      closeOnEscape: false,
      data: {
        qId: this.qId(),
        type,
        currency: this.currency(),
        qOtherChargeId: otherCharge?.id
      }
    });
    modal.onClose.subscribe({
      next: (resp: {valid: boolean, otherCharge: IpQuotationOtherCharge}) => {
        if (resp.valid) {
          this._validClose.update(() => true);
          if (type === 'create') {
            this._quotationOtherCharges.update(list =>{
              list.push(resp.otherCharge);
              return list;
            });
          } else if (type === 'edit') {
            this._quotationOtherCharges.update(list =>{
              const newList = [...list];
              newList[index!] = resp.otherCharge;
              return newList;
            });
          }
        }
      }
    });
  }

  canEdit(): boolean {
    return this.type() === 'edit';
  }
}
