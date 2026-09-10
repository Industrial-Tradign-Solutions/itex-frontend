import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ListIpQuoteRequest } from '@interfaces/ip/quoteRequest';
import { BasicUser } from '@interfaces/administration/user';
import { IpQuotationService, IpQuoteRequestService } from '@services/ip';
import { UsersService } from '@services/admin';
import { UtilService } from '@services/util';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { environment } from '../../../../../environments/environment';
import { TitlesMessages } from '@config/messages';
import { finalize, map } from 'rxjs';

const TIMEOUT = environment.timeout;
const TITLES = TitlesMessages;

type QuoteRequestLink = { qqrId?: string; id?: string; number?: string };

export type AddQuoteRequestsModalData = {
  qId: string;
  clientId: string;
  currency: string;
  listAddQR: QuoteRequestLink[];
  salesRep: BasicUser | null;
};

/**
 * Normaliza los datos que llegan por `DynamicDialogConfig`: centraliza los
 * defaults para que el filtro de Sales Rep arranque con el rep de la Q.
 */
export function normalizeAddQuoteRequestsModalData(
  raw: Partial<AddQuoteRequestsModalData> | undefined
): AddQuoteRequestsModalData {
  return {
    qId: raw?.qId ?? '',
    clientId: raw?.clientId ?? '',
    currency: raw?.currency ?? 'USD',
    listAddQR: raw?.listAddQR ?? [],
    salesRep: raw?.salesRep ?? null
  };
}

@Component({
  selector: 'app-add-quote-requests-modal',
  templateUrl: './add-quote-requests-modal.component.html',
  styleUrl: './add-quote-requests-modal.component.scss'
})
export class AddQuoteRequestsModalComponent implements OnInit {

  //! Inyecciones
  private config      = inject(DynamicDialogConfig);
  private ref         = inject(DynamicDialogRef);
  private utilSV      = inject(UtilService);
  private userSV      = inject(UsersService);
  private qSV         = inject(IpQuotationService);
  private quoteRequestSV  = inject(IpQuoteRequestService);
  //! -----------------------------------------------

  //* Señales
  private _data = signal<AddQuoteRequestsModalData>(normalizeAddQuoteRequestsModalData(this.config.data));
  private _loading = signal<boolean>(true);
  loading = computed<boolean>(() => this._loading());
  qId = computed<string>(() => this._data().qId);
  listAdQR = computed<QuoteRequestLink[]>(() => this._data().listAddQR);
  clientId = computed<string>(() => this._data().clientId);
  currency = computed<string>(() => this._data().currency);
  private _listEmployees = signal<BasicUser[]>([]);
  listEmployees = computed<BasicUser[]>(() => this._listEmployees());
  //*------------------------------------------------
  //? Variables
  viewCompletedQR: boolean = false;
  selectedQR: ListIpQuoteRequest[] = [];
  salesRepId: string | null = null;
  //?------------------------------------------------------------

  private _listQR = signal<ListIpQuoteRequest[]>([]);
  listQR = computed<ListIpQuoteRequest[]>(() => this._listQR());

  ngOnInit(): void {
    this.loadEmployees();
  }

  onSubmit(): void {
    if (this.selectedQR.length === 0) {
      this.utilSV.setMessage(TITLES.warning, 'Please select at least one Quote Request', 'warn');
      return;
    }

    this._loading.set(true);
    const quoteRequestIds = this.selectedQR.map(qr => qr.id);

    setTimeout(() => {
      this.qSV.addQuoteRequestsToQuotation(this.qId(), { quoteRequestIds })
      .pipe(
        finalize(() => this._loading.set(false))
      )
      .subscribe({
        next: (resp) => {
          this.utilSV.setMessage(resp.title, resp.message, 'success');
          this.ref.close({ valid: true, quotation: resp.data });
        },
        error: (err) => this.utilSV.setMessage(TITLES.error, err, 'error'),
      });
    }, TIMEOUT);
  }

  closeModal() {
    this.ref.close({ valid: false });
  }

  search(): void {
    this._loading.set(true);
    // Al refiltrar cambian los candidatos: se descartan las selecciones previas
    // para no llegar a enviar QR que ya no figuran en la tabla.
    this.selectedQR = [];
    this.quoteRequestSV.getListQuoteRequestByClientAvailableToQuotation(
      this.clientId(),
      this.viewCompletedQR,
      this.currency(),
      this.salesRepId
    )
    .pipe(
      finalize(() => this.disableLogin()),
      map((items: ListIpQuoteRequest[]) => {
        const idsExistentes = new Set(this.listAdQR().map(item => item.id));
        const resp: ListIpQuoteRequest[] =  items.filter(item => !idsExistentes.has(item.id));
        return resp;
      })
    )
    .subscribe({
      next: (resp) => {
        this._listQR.set(resp);
      },
      error: (err) => {
        this.utilSV.setMessage(TITLES.error, err, 'error');
      },
    });
  }

  /**
   * El rep de la Q puede no estar entre los activos (desactivado luego de
   * creada); se agrega a la lista para que el filtro muestre su nombre y no
   * quede vacío.
   */
  private loadEmployees(): void {
    this.userSV.loadEmployees(false).subscribe({
      next: employees => this.applyEmployees(employees),
      error: (err) => {
        this.utilSV.setMessage(TITLES.error, err, 'error');
        this.applyEmployees([]);
      }
    });
  }

  private applyEmployees(employees: BasicUser[]): void {
    const { salesRep } = this._data();
    const list = salesRep && !employees.some(employee => employee.id === salesRep.id)
      ? [...employees, salesRep]
      : employees;

    this._listEmployees.set(list);
    this.salesRepId = salesRep?.id ?? null;
    this.search();
  }

  private disableLogin() {
    setTimeout(() => {
      this._loading.set(false);
    }, TIMEOUT);
  }
}
