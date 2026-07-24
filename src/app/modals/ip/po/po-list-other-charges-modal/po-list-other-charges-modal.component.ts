import { Component, computed, inject, signal } from '@angular/core';
import { IpPurchaseOrderService } from '@services/ip';
import { UtilService } from '@services/util';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TitlesMessages } from '@config/messages';
import { finalize, Observable } from 'rxjs';
import {
  IpPurchaseOrderOtherCharge,
  IpPurchaseOrderOtherChargesQuotation,
  IpPurchaseOrderOtherChargesQuotationQr
} from '@interfaces/ip/purchaseOrder';
import { MessageResponse } from '@interfaces/message-response';
import { PoOtherChargesModalComponent } from '../po-other-charges-modal/po-other-charges-modal.component';
import { PoImportOtherChargesModalComponent } from '../po-import-other-charges-modal/po-import-other-charges-modal.component';

const TITLES = TitlesMessages;

type ChargeSource = 'own' | 'q' | 'qr';

interface PoDisplayCharge {
  linkId: string;
  description: string;
  value: number;
  source: ChargeSource;
  sourceNumber?: string;
}

@Component({
  selector: 'app-po-list-other-charges-modal',
  templateUrl: './po-list-other-charges-modal.component.html',
  styleUrl: './po-list-other-charges-modal.component.scss'
})
export class PoListOtherChargesModalComponent {

  private config   = inject(DynamicDialogConfig);
  private ref      = inject(DynamicDialogRef);
  private utilSV   = inject(UtilService);
  private poSV     = inject(IpPurchaseOrderService);
  private dialogSV = inject(DialogService);

  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());

  poId = computed<string>(() => this.config.data.poId);
  type = computed<'view' | 'edit'>(() => this.config.data.type);
  currency = computed<string>(() => this.config.data.currency);
  poStatus = computed<string>(() => this.config.data.poStatus);
  hasQuotation = computed<boolean>(() => !!this.config.data.hasQuotation);

  private _ownCharges = signal<IpPurchaseOrderOtherCharge[]>(this.config.data.otherCharges || []);
  private _importedQ = signal<IpPurchaseOrderOtherChargesQuotation[]>(this.config.data.importedQuotationCharges || []);
  private _importedQr = signal<IpPurchaseOrderOtherChargesQuotationQr[]>(this.config.data.importedQuoteRequestCharges || []);

  displayCharges = computed<PoDisplayCharge[]>(() => {
    const own: PoDisplayCharge[] = this._ownCharges().map(c => ({
      linkId: c.id,
      description: c.description,
      value: c.value,
      source: 'own'
    }));
    const q: PoDisplayCharge[] = this._importedQ().map(c => ({
      linkId: c.id,
      description: c.quotationOtherCharge?.description ?? '',
      value: c.quotationOtherCharge?.value ?? 0,
      source: 'q'
    }));
    const qr: PoDisplayCharge[] = this._importedQr().map(c => ({
      linkId: c.id,
      description: c.quotationQrOtherCharge?.qrOtherCharge?.description ?? '',
      value: c.quotationQrOtherCharge?.qrOtherCharge?.value ?? 0,
      source: 'qr'
    }));
    return [...own, ...q, ...qr];
  });

  private _validClose = signal<boolean>(false);

  // §1.2: editable only while not COMPLETE/REJECTED.
  canShowActions = computed<boolean>(() =>
    this.type() === 'edit' && !['COMPLETE', 'REJECTED'].includes(this.poStatus())
  );

  sourceTag(charge: PoDisplayCharge): string {
    switch (charge.source) {
      case 'q':  return 'IMPORTED Q';
      case 'qr': return 'IMPORTED QR';
      default:   return 'OWN';
    }
  }

  closeModal(): void {
    this.ref.close({ valid: this._validClose() });
  }

  deleteOtherCharge(charge: PoDisplayCharge): void {
    this.utilSV.confirm({
      message: `Remove the charge "<b>${charge.description}</b>"?`,
      header: TITLES.confirmation,
      accept: () => {
        this._loading.set(true);
        const delete$: Observable<MessageResponse<string>> =
          charge.source === 'own' ? this.poSV.removeOtherCharge(this.poId(), charge.linkId)
          : charge.source === 'q' ? this.poSV.removeImportedChargeFromQuotation(this.poId(), charge.linkId)
          : this.poSV.removeImportedChargeFromQuotationQr(this.poId(), charge.linkId);

        delete$
          .pipe(finalize(() => this._loading.set(false)))
          .subscribe({
            next: resp => {
              this.utilSV.setMessage(resp.title, resp.message, 'success');
              this.removeLocal(charge);
              this._validClose.set(true);
            },
            error: err => this.utilSV.setMessage(TITLES.error, err, 'error')
          });
      }
    });
  }

  private removeLocal(charge: PoDisplayCharge): void {
    if (charge.source === 'own') {
      this._ownCharges.update(l => l.filter(c => c.id !== charge.linkId));
    } else if (charge.source === 'q') {
      this._importedQ.update(l => l.filter(c => c.id !== charge.linkId));
    } else {
      this._importedQr.update(l => l.filter(c => c.id !== charge.linkId));
    }
  }

  openModalOtherCharges(type: 'edit' | 'create', charge?: PoDisplayCharge): void {
    const modal = this.dialogSV.open(PoOtherChargesModalComponent, {
      header: 'OTHER CHARGES',
      width: '30rem',
      closable: false,
      closeOnEscape: false,
      data: {
        poId: this.poId(),
        type,
        chargeId: charge?.linkId,
        charge: charge ? { id: charge.linkId, description: charge.description, value: charge.value } : undefined
      }
    });
    modal.onClose.subscribe({
      next: (resp: { valid: boolean; otherCharge?: IpPurchaseOrderOtherCharge }) => {
        if (!resp?.valid || !resp.otherCharge) return;
        this._validClose.set(true);
        if (type === 'create') {
          this._ownCharges.update(l => [...l, resp.otherCharge!]);
        } else {
          this._ownCharges.update(l => l.map(c => c.id === resp.otherCharge!.id ? resp.otherCharge! : c));
        }
      }
    });
  }

  openModalImport(source: 'quotation' | 'quotation-qr'): void {
    const modal = this.dialogSV.open(PoImportOtherChargesModalComponent, {
      header: source === 'quotation' ? 'IMPORT FROM QUOTATION' : 'IMPORT FROM QUOTATION QR',
      width: '60rem',
      closable: false,
      closeOnEscape: false,
      data: { poId: this.poId(), currency: this.currency(), source }
    });
    modal.onClose.subscribe({
      next: (resp: { valid: boolean }) => {
        if (resp?.valid) {
          this._validClose.set(true);
          // Imported rows come back nested; reload the parent form to re-read them.
          this.ref.close({ valid: true });
        }
      }
    });
  }
}
