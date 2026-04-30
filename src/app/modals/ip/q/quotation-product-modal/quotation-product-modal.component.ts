import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StaticListsService, UtilService } from '@services/util';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { environment } from '../../../../../environments/environment';
import { Messages, TitlesMessages } from '@config/messages';
import { StaticListItem } from '@interfaces/static-list.model';
import { IpQuotationService } from '@services/ip';
import { IpQuoteRequestService } from '@services/ip/ip-quote-request.service';
import { IpQuotationProduct, mapToIpQuotationProductRequest } from '@interfaces/ip/quotation';
import { IpQuoteRequestProduct } from '@interfaces/ip/quoteRequest';
import { finalize, Observable } from 'rxjs';
import { MessageResponse } from '@interfaces/message-response';

const TIMEOUT = environment.timeout;
const TITLES = TitlesMessages;

@Component({
  selector: 'app-quotation-product-modal',
  templateUrl: './quotation-product-modal.component.html',
  styleUrl: './quotation-product-modal.component.scss'
})
export class QuotationProductModalComponent implements OnInit {
  //! Inyecciones
  private config      = inject(DynamicDialogConfig);
  private ref         = inject(DynamicDialogRef);
  private formBuilder = inject(FormBuilder);
  private utilSV      = inject(UtilService);
  private staticListSV= inject(StaticListsService);
  private quotationSV = inject(IpQuotationService);
  private qrSV        = inject(IpQuoteRequestService);
  //! -----------------------------------------------

  //* Señales
  listCondition = computed<StaticListItem[]>(() => this.staticListSV.getListIpQuotationProductCondition());
  private _loading = signal<boolean>(true);
  loading = computed<boolean>(() => this._loading());
  type = computed<'create' | 'edit'>(() => this.config.data.type);
  qId = computed<string>(() => this.config.data.qId);
  qProductId = computed<string | undefined>(() => this.config.data.productId);
  listQuoteRequests = computed<{qqrId?: string, id?: string, number?: string}[]>(() => this.config.data.listQuoteRequests ?? []);

  private _qrProducts = signal<IpQuoteRequestProduct[]>([]);
  qrProducts = computed<IpQuoteRequestProduct[]>(() => this._qrProducts());
  //*------------------------------------------------

  formProduct!: FormGroup;

  ngOnInit(): void {
    setTimeout(() => this.initForm(), TIMEOUT);
  }

  onSubmit(): void {
    if (this.formProduct.pristine) {
      this.ref.close({valid: true});
      return;
    }
    this._loading.set(true);
    setTimeout(() => {
      this.submitAction().pipe(
        finalize(() => this._loading.set(false))
      ).subscribe({
        next: (resp) => {
          this.utilSV.setMessage(resp.title, resp.message, 'success')
          this.ref.close({valid: true});
        },
        error: (err) => this.utilSV.setMessage(TITLES.error, err, 'error'),
      })
    }, TIMEOUT);
  }

  private submitAction(): Observable<MessageResponse<IpQuotationProduct>> {
    const data = mapToIpQuotationProductRequest(this.formProduct.value);
    if (this.type() === 'create') {
      return this.quotationSV.createQuotationProduct(this.qId(), data);
    } else {
      return this.quotationSV.updateQuotationProduct(this.qId(), this.qProductId()!, data);
    }
  }

  closeModal() {
    this.ref.close({valid: false});
  }

  onQrChange(qqrId: string): void {
    this._qrProducts.set([]);
    this.formProduct.patchValue({ quoteRequestProductId: null });
    const qr = this.listQuoteRequests().find(q => q.qqrId === qqrId);
    if (!qr?.id) return;
    this.qrSV.getQuoteRequestById(qr.id).subscribe({
      next: (resp) => this._qrProducts.set(resp.products ?? []),
      error: () => this._qrProducts.set([])
    });
  }

  private initForm(): void {
    if (this.type() === 'create') {
      this.buildForm();
      this._loading.set(false);
      return;
    }
    this.quotationSV.getQuotationProduct(this.qProductId()!, this.qId())
    .pipe(
      finalize(() => this._loading.set(false))
    )
    .subscribe({
      next: (resp) => {
        this.buildForm(resp);
        if (resp.quotationsQuoteRequestId) {
          this.onQrChange(resp.quotationsQuoteRequestId);
        }
      },
      error: (err) => this.utilSV.setMessage(TITLES.error, err, 'error'),
    });
  }

  private buildForm(qProduct?: IpQuotationProduct): void {
    this.formProduct = this.formBuilder.group({
      quotationsQuoteRequestId: [
        qProduct?.quotationsQuoteRequestId ?? null,
        [Validators.required]
      ],
      quoteRequestProductId: [
        qProduct?.quoteRequestProduct?.id ?? null,
        []
      ],
      profitMargin: [
        qProduct?.profitMargin ?? 0,
        [Validators.required, Validators.min(0)]
      ],
      condition: [
        qProduct?.condition ?? null,
        [Validators.required]
      ],
    });
  }
}

