import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientBasic } from '@interfaces/partners/clients';
import { SupplierBasic } from '@interfaces/partners/suppliers';
import { IpQuotationService, IpPurchaseOrderService } from '@services/ip';
import { ClientsService } from '@services/partners';
import { StaticListsService, UtilService } from '@services/util';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { finalize } from 'rxjs';
import { AvailableForPurchaseOrder } from '@interfaces/ip/quotation';
import { CreatePurchaseOrderRequest } from '@interfaces/ip/purchaseOrder';
import { StaticListItem } from '@interfaces/static-list.model';
import { environment } from '../../../../../environments/environment';

const TIMEOUT = environment.timeout;

@Component({
  selector: 'app-new-purchase-order-modal',
  templateUrl: './new-purchase-order-modal.component.html',
  styleUrl: './new-purchase-order-modal.component.scss'
})
export class NewPurchaseOrderModalComponent implements OnInit {
  private ipPurchaseOrderSV = inject(IpPurchaseOrderService);
  private ipQuotationSV     = inject(IpQuotationService);
  private clientSV          = inject(ClientsService);
  private formBuilder       = inject(FormBuilder);
  private ref               = inject(DynamicDialogRef);
  private staticListSV      = inject(StaticListsService);
  private utilSV            = inject(UtilService);

  private _loading = signal<boolean>(true);
  loading = computed<boolean>(() => this._loading());

  private _listQuotations = signal<AvailableForPurchaseOrder[]>([]);
  listQuotations = computed<AvailableForPurchaseOrder[]>(() => this._listQuotations());

  private _listSuppliers = signal<SupplierBasic[]>([]);
  listSuppliers = computed<SupplierBasic[]>(() => this._listSuppliers());

  listCurrency = computed<StaticListItem[]>(() => this.staticListSV.getListCurrency());

  form!: FormGroup;

  selectedQ: AvailableForPurchaseOrder | null = null;
  viewCompleted: boolean = false;

  private _lastSelectedId: string | null = null;

  oldKeyAutoCompleteClient: string = '';

  constructor() {
    this.clientSV.loadAllBasic();
    this.buildForm();
  }

  ngOnInit(): void {
    this.form.patchValue({ currency: 'USD' });
    this.stopLoading();
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      clientId:   [null, Validators.required],
      supplierId: [{ value: null, disabled: true }],
      currency:   ['USD']
    });
  }

  canSearch(): boolean {
    return !!this.form.getRawValue().clientId;
  }
  // ---------------------------------------------------------------------------
  // Client
  // ---------------------------------------------------------------------------
  onClientSelected(): void {
    if (!this.canSearch()) return;
    this.deselectQ();
    this.loadQuotations();
  }

  onClientCleared(): void {
    this._listQuotations.set([]);
    this.deselectQ();
  }
  // ---------------------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------------------
  onFilterChanged(): void {
    if (!this.canSearch()) return;
    this.deselectQ();
    this.loadQuotations();
  }
  // ---------------------------------------------------------------------------
  // Q selection via radio
  // ---------------------------------------------------------------------------
  toggleQSelection(q: AvailableForPurchaseOrder): void {
    if (this._lastSelectedId === q.id) {
      this.selectedQ = null;
      this.deselectQ();
      this._lastSelectedId = null;
    } else {
      this._lastSelectedId = q.id;
      this.selectQ(q);
    }
  }

  private selectQ(q: AvailableForPurchaseOrder): void {
    this.selectedQ = q;
    this.form.get('clientId')?.disable();
    this.form.get('supplierId')?.enable();
    this.form.get('supplierId')?.setValidators([Validators.required]);
    this.form.get('supplierId')?.updateValueAndValidity();
    this._listSuppliers.set(q.suppliers);
    if (q.suppliers.length === 1) {
      this.form.get('supplierId')?.setValue(q.suppliers[0].id);
    }
  }

  private deselectQ(): void {
    this.selectedQ = null;
    this.form.get('clientId')?.enable();
    this.form.get('supplierId')?.disable();
    this.form.get('supplierId')?.clearValidators();
    this.form.get('supplierId')?.reset();
    this.form.get('supplierId')?.updateValueAndValidity();
    this._listSuppliers.set([]);
  }
  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------
  private loadQuotations(): void {
    const raw = this.form.getRawValue();
    if (!raw.clientId) return;

    this._loading.set(true);
    this.ipQuotationSV.getQuotationsAvailableForPurchaseOrder(raw.clientId, this.viewCompleted, raw.currency)
      .pipe(finalize(() => this.stopLoading()))
      .subscribe({
        next: resp => this._listQuotations.set(resp),
        error: err => this.utilSV.setMessage('Error!', err, 'error')
      });
  }
  // ---------------------------------------------------------------------------
  // Save / Cancel
  // ---------------------------------------------------------------------------
  createPurchaseOrder(): void {
    if (this.form.invalid) return;
    this._loading.set(true);

    const raw = this.form.getRawValue();
    const request: CreatePurchaseOrderRequest = { clientId: raw.clientId };

    if (this.selectedQ) {
      request.quotationId = this.selectedQ.id;
      request.supplierId = raw.supplierId;
    }

    this.ipPurchaseOrderSV.createPurchaseOrder(request)
      .pipe(finalize(() => this.stopLoading()))
      .subscribe({
        next: resp => {
          this.utilSV.setMessage(resp.title, resp.message, 'success');
          setTimeout(() => this.ref.close({ valid: true, data: resp.data }), TIMEOUT);
        },
        error: err => this.utilSV.setMessage('Error!', err, 'error')
      });
  }

  closeModal(): void {
    this.ref.close({ valid: false });
  }
  // ---------------------------------------------------------------------------
  // Autocomplete helpers
  // ---------------------------------------------------------------------------
  searchByClient(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.oldKeyAutoCompleteClient === 'Enter') {
      this.onClientSelected();
      event.preventDefault();
    } else {
      this.oldKeyAutoCompleteClient = event.key;
    }
  }

  get filteredClients(): ClientBasic[] {
    return this.clientSV.filteredList;
  }

  searchClient(event: AutoCompleteCompleteEvent): void {
    this.clientSV.searchAutoComplete(event);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'CREATED':   return 'new';
      case 'REJECTED':  return 'unqualified';
      case 'SENT':      return 'renewal';
      case 'ANSWERED':  return 'negotiation';
      case 'COMPLETE':  return 'qualified';
      default:          return 'new';
    }
  }

  getSupplierDisplay(q: AvailableForPurchaseOrder): string {
    if (!q.suppliers?.length) return '\u2014';
    if (q.suppliers.length === 1) return q.suppliers[0].name;
    return `Multiple (${q.suppliers.length})`;
  }

  private stopLoading(): void {
    setTimeout(() => this._loading.set(false), TIMEOUT);
  }
}
