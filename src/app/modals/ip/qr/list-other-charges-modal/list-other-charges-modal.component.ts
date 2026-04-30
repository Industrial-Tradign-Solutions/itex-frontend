import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { IpQuoteRequestOtherCharges } from '@interfaces/ip/quoteRequest';
import { IpQuoteRequestService } from '@services/ip';
import { UtilService } from '@services/util';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { environment } from '../../../../../environments/environment';
import { Messages, TitlesMessages } from '@config/messages';
import { finalize } from 'rxjs';
import { OtherChargesModalComponent } from '../other-charges-modal/other-charges-modal.component';

const TIMEOUT = environment.timeout;
const MESSAGES = Messages.pages.ip.quoteRequest;
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
  private qrSV        = inject(IpQuoteRequestService);
  private dialogSV    = inject(DialogService);
  //! -----------------------------------------------

  protected _loading = signal<boolean>(true);
  loading = computed<boolean>(() => this._loading());
  qrId = computed<string>(() => this.config.data.qrId);
  type = computed<'view' | 'edit'>(() => this.config.data.type);
  currency = computed<string>(() => this.config.data.currency);
  private _otherCharges = signal<IpQuoteRequestOtherCharges[]>(this.config.data.otherCharges);
  otherCharges = computed<IpQuoteRequestOtherCharges[]>(() => this._otherCharges());

  protected _validClose = signal<boolean>(false);
  validClose = computed<boolean>(() => this._validClose());


  ngOnInit(): void {
    setTimeout(() => {
      this._loading.update(() => false);
    }, TIMEOUT);
  }

  closeModal() {
    this.ref.close({valid: this.validClose()});
  }

  deleteOtherCharge(otherCharge: IpQuoteRequestOtherCharges, index: number) {
    this.utilSV.confirm({
      message: MESSAGES.removeOtherCharge(otherCharge.description, otherCharge.value, this.currency()),
      accept: () => {
        this._loading.set(true);
        this.qrSV.removeQuoteRequestOtherCharge(otherCharge.id, this.qrId())
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
            this._otherCharges.update(list =>
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

  openModalOtherCharges(type: 'edit' | 'create', otherCharge?: IpQuoteRequestOtherCharges, index?: number) {
    let modal =  this.dialogSV.open(OtherChargesModalComponent,{
      header: `OTHER CHARGES` ,
      width: '30rem',
      closable: false,
      closeOnEscape: false,
      data: {
        qrId: this.qrId(),
        type,
        currency: this.currency(),
        qrOtherChargeId: otherCharge?.id
      }
    });
    modal.onClose.subscribe({
      next: (resp: {valid: boolean, otherCharge: IpQuoteRequestOtherCharges}) => {
        if (resp.valid) {
          this._validClose.update(() => true);
          if (type === 'create') {
            this._otherCharges.update(list =>{
              list.push(resp.otherCharge);
              return list;
            });
          } else if (type === 'edit') {
            this._otherCharges.update(list =>{
              const newList = [...list];
              newList[index!] = resp.otherCharge;
              return newList;
            });
          }
        }
      }
    });
  }
}
