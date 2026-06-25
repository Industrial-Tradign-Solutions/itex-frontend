import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StaticListsService, UtilService } from '@services/util';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { environment } from '../../../../../environments/environment';
import { TitlesMessages } from '@config/messages';
import { StaticListItem } from '@interfaces/static-list.model';
import { IpQuotationService } from '@services/ip';
import { finalize } from 'rxjs';

const TIMEOUT = environment.timeout;
const TITLES = TitlesMessages;

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

  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());

  qId = computed<string>(() => this.config.data.qId);
  qProductId = computed<string>(() => this.config.data.qProductId);
  quotationsQuoteRequestId = computed<string>(() => this.config.data.quotationsQuoteRequestId);
  quoteRequestProductId = computed<string>(() => this.config.data.quoteRequestProductId);

  formProduct!: FormGroup;

  ngOnInit(): void {
    setTimeout(() => this.buildForm(), TIMEOUT);
  }

  private buildForm(): void {
    this.formProduct = this.formBuilder.group({
      profitMargin: [
        this.config.data.profitMargin ?? 0,
        [Validators.required, Validators.min(0.01), Validators.max(100)]
      ],
      condition: [
        this.config.data.condition ?? null,
        [Validators.required]
      ]
    });
  }

  onSubmit(): void {
    if (this.formProduct.pristine) {
      this.ref.close({ valid: true });
      return;
    }

    this._loading.set(true);
    const data = {
      quotationsQuoteRequestId: this.quotationsQuoteRequestId(),
      quoteRequestProductId: this.quoteRequestProductId(),
      profitMargin: this.formProduct.value.profitMargin / 100,
      condition: this.formProduct.value.condition
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
