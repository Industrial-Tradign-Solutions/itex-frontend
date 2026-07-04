import { Component, computed, inject, signal } from '@angular/core';
import { DisplayOtherCharge, IpQuotationImportedOtherCharge, IpQuotationOtherCharge } from '@interfaces/ip/quotation';
import { IpQuotationService } from '@services/ip';
import { UtilService } from '@services/util';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Messages, TitlesMessages } from '@config/messages';
import { finalize } from 'rxjs';
import { OtherChargesModalComponent } from '../other-charges-modal/other-charges-modal.component';
import { ImportOtherChargesFromQrModalComponent } from '../import-other-charges-from-qr-modal/import-other-charges-from-qr-modal.component';

const MESSAGES = Messages.pages.ip.quotation;
const TITLES = TitlesMessages;

@Component({
  selector: 'app-list-other-charges-modal',
  templateUrl: './list-other-charges-modal.component.html',
  styleUrl: './list-other-charges-modal.component.scss'
})
export class ListOtherChargesModalComponent {

  private config      = inject(DynamicDialogConfig);
  private ref         = inject(DynamicDialogRef);
  private utilSV      = inject(UtilService);
  private qSV         = inject(IpQuotationService);
  private dialogSV    = inject(DialogService);

  protected _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());
  qId = computed<string>(() => this.config.data.qId);
  type = computed<'view' | 'edit'>(() => this.config.data.type);
  currency = computed<string>(() => this.config.data.currency);
  qStatus = computed<string>(() => this.config.data.qStatus);

  private _quotationOtherCharges = signal<IpQuotationOtherCharge[]>(this.config.data.otherCharges || []);
  private _qrOtherCharges = signal<IpQuotationImportedOtherCharge[]>(this.config.data.qrOtherCharges || []);
  private listQuoteRequests = computed<{qqrId?: string; id?: string; number?: string}[]>(() => this.config.data.listQuoteRequests || []);

  displayCharges = computed<DisplayOtherCharge[]>(() => {
    const own: DisplayOtherCharge[] = this._quotationOtherCharges().map(c => ({
      id: c.id,
      description: c.description,
      value: c.value,
      isImported: false
    }));

    const qrMap = new Map<string, string>();
    for (const qr of this.listQuoteRequests()) {
      if (qr.qqrId && qr.number) {
        qrMap.set(qr.qqrId, qr.number);
      }
    }

    const imported: DisplayOtherCharge[] = this._qrOtherCharges().map(c => ({
      id: c.id,
      description: c.qrOtherCharge.description,
      value: c.qrOtherCharge.value,
      isImported: true,
      qrNumber: qrMap.get(c.quotationsQuoteRequestId) || '',
      quotationsQuoteRequestId: c.quotationsQuoteRequestId
    }));

    return [...own, ...imported];
  });

  protected _validClose = signal<boolean>(false);
  validClose = computed<boolean>(() => this._validClose());

  canShowActions = computed<boolean>(() => {
    return this.type() === 'edit' && !['COMPLETE', 'REJECTED'].includes(this.qStatus());
  });

  closeModal() {
    this.ref.close({valid: this.validClose()});
  }

  deleteOtherCharge(charge: DisplayOtherCharge) {
    this.utilSV.confirm({
      message: MESSAGES.removeOtherCharge(charge.description, charge.value, this.currency()),
      accept: () => {
        this._loading.set(true);

        const delete$ = charge.isImported
          ? this.qSV.removeImportedOtherChargeFromQr(this.qId(), charge.id)
          : this.qSV.removeQuotationOtherCharge(this.qId(), charge.id);

        delete$.pipe(
          finalize(() => this._loading.set(false))
        )
        .subscribe({
          next: (resp) => {
            this.utilSV.setMessage(resp.title, resp.message, 'success');
            if (charge.isImported) {
              this._qrOtherCharges.update(list => list.filter(c => c.id !== charge.id));
            } else {
              this._quotationOtherCharges.update(list => list.filter(c => c.id !== charge.id));
            }
            this._validClose.update(() => true);
          },
          error: (err) => {
            this.utilSV.setMessage(TITLES.error, err, 'error');
          },
        });
      }
    })
  }

  openModalOtherCharges(type: 'edit' | 'create', charge?: DisplayOtherCharge) {
    const ownCharge = charge
      ? this._quotationOtherCharges().find(c => c.id === charge.id)
      : undefined;

    const modal = this.dialogSV.open(OtherChargesModalComponent, {
      header: 'OTHER CHARGES',
      width: '30rem',
      closable: false,
      closeOnEscape: false,
      data: {
        qId: this.qId(),
        type,
        currency: this.currency(),
        qOtherChargeId: ownCharge?.id
      }
    });
    modal.onClose.subscribe({
      next: (resp: {valid: boolean, otherCharge: IpQuotationOtherCharge}) => {
        if (resp.valid) {
          this._validClose.update(() => true);
          if (type === 'create') {
            this._quotationOtherCharges.update(list =>
              [...list, resp.otherCharge]
            );
          } else if (type === 'edit') {
            this._quotationOtherCharges.update(list => {
              return list.map(c => c.id === resp.otherCharge.id ? resp.otherCharge : c);
            });
          }
        }
      }
    });
  }

  openModalImportFromQr() {
    const modal = this.dialogSV.open(ImportOtherChargesFromQrModalComponent, {
      header: 'IMPORT OTHER CHARGES FROM QR',
      width: '60rem',
      closable: false,
      closeOnEscape: false,
      data: {
        qId: this.qId(),
        currency: this.currency(),
        listQuoteRequests: this.config.data.listQuoteRequests || []
      }
    });
    modal.onClose.subscribe({
      next: (resp: { valid: boolean; data?: IpQuotationImportedOtherCharge[] }) => {
        if (resp && resp.valid && resp.data) {
          this._validClose.update(() => true);
          this._qrOtherCharges.update(list => [...list, ...resp.data!]);
        }
      }
    });
  }

  canEdit(): boolean {
    return this.type() === 'edit';
  }
}
