import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StaticListsService, UtilService } from '@services/util';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { environment } from '../../../../../environments/environment';
import { TitlesMessages } from '@config/messages';
import { StaticListItem } from '@interfaces/static-list.model';
import { IpQuotationService } from '@services/ip';
import { IpQuotationProductRequest } from '@interfaces/ip/quotation';
import { finalize } from 'rxjs';

const TIMEOUT = environment.timeout;
const TITLES = TitlesMessages;
const MAX_LEAD_TIME = 999999;

export type EditQuotationProductModalData = {
  qId: string;
  qProductId: string;
  quotationsQuoteRequestId: string;
  quoteRequestProductId: string;
  profitMargin: number | null;
  condition: string | null;
  itsLeadTime: number | null;
  leadTimeType: string | null;
};

/**
 * Normaliza los datos que llegan por `DynamicDialogConfig`: centraliza los
 * defaults y evita colgar propiedades sin garantir sobre un `data` dinámico.
 */
export function normalizeEditQuotationProductModalData(
  raw: Partial<EditQuotationProductModalData> | undefined
): EditQuotationProductModalData {
  return {
    qId: raw?.qId ?? '',
    qProductId: raw?.qProductId ?? '',
    quotationsQuoteRequestId: raw?.quotationsQuoteRequestId ?? '',
    quoteRequestProductId: raw?.quoteRequestProductId ?? '',
    profitMargin: raw?.profitMargin ?? 0,
    condition: raw?.condition ?? null,
    itsLeadTime: raw?.itsLeadTime ?? 0,
    leadTimeType: raw?.leadTimeType ?? null
  };
}

@Component({
  selector: 'app-edit-quotation-product-modal',
  templateUrl: './edit-quotation-product-modal.component.html',
  styleUrl: './edit-quotation-product-modal.component.scss'
})
export class EditQuotationProductModalComponent implements OnInit {


  private config = inject(DynamicDialogConfig);
  private ref = inject(DynamicDialogRef);
  private formBuilder = inject(FormBuilder);
  private utilSV = inject(UtilService);
  private staticListSV = inject(StaticListsService);
  private quotationSV = inject(IpQuotationService);

  listCondition = computed<StaticListItem[]>(() => this.staticListSV.getListIpQuotationProductCondition());
  listLeadTimeType = computed<StaticListItem[]>(() => this.staticListSV.getListLeadTimeType());

  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());

  private _data = signal<EditQuotationProductModalData>(
    normalizeEditQuotationProductModalData(this.config.data)
  );
  qId = computed<string>(() => this._data().qId);
  qProductId = computed<string>(() => this._data().qProductId);
  quotationsQuoteRequestId = computed<string>(() => this._data().quotationsQuoteRequestId);
  quoteRequestProductId = computed<string>(() => this._data().quoteRequestProductId);

  formProduct!: FormGroup;

  ngOnInit(): void {
    setTimeout(() => this.buildForm(), TIMEOUT);
  }

  private buildForm(): void {
    const { profitMargin, condition, itsLeadTime, leadTimeType } = this._data();

    this.formProduct = this.formBuilder.group({
      profitMargin: [
        profitMargin,
        [Validators.required, Validators.min(0.01), Validators.max(100)]
      ],
      condition: [
        condition,
        [Validators.required]
      ],
      itsLeadTime: [
        itsLeadTime,
        [Validators.required, Validators.min(0), Validators.max(MAX_LEAD_TIME)]
      ],
      leadTimeType: [
        { value: leadTimeType, disabled: true }
      ]
    });
  }

  onSubmit(): void {
    if (this.formProduct.pristine) {
      this.ref.close({ valid: true });
      return;
    }

    this._loading.set(true);
    const { profitMargin, condition, itsLeadTime } = this.formProduct.getRawValue() as
      Pick<IpQuotationProductRequest, 'profitMargin' | 'condition' | 'itsLeadTime'>;

    const data: IpQuotationProductRequest = {
      quotationsQuoteRequestId: this.quotationsQuoteRequestId(),
      quoteRequestProductId: this.quoteRequestProductId(),
      profitMargin,
      condition,
      itsLeadTime: itsLeadTime ?? 0
    };

    setTimeout(() => {
      this.quotationSV.updateQuotationProduct(this.qId(), this.qProductId(), data)
        .pipe(finalize(() => this._loading.set(false)))
        .subscribe({
          next: (resp) => {
            this.utilSV.setMessage(resp.title, resp.message, 'success');
            this.ref.close({ valid: true });
          },
          error: (err) => this.utilSV.setMessage(TITLES.error, err, 'error'),
        });
    }, TIMEOUT);
  }

  closeModal(): void {
    this.ref.close({ valid: false });
  }
}
