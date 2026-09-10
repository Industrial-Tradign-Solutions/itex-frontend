import { Component, computed, inject, signal } from '@angular/core';
import { ClientBasic } from '@interfaces/partners/clients';
import { IpQuotationService, IpQuoteRequestService } from '@services/ip';
import { ClientsService } from '@services/partners';
import { UsersService } from '@services/admin';
import { StaticListsService, StorageService, UtilService } from '@services/util';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { environment } from '../../../../../environments/environment';
import { storageKeys } from '../../../../../environments';
import { ListIpQuoteRequest } from '@interfaces/ip/quoteRequest';
import { BasicUser, UserInfo } from '@interfaces/administration/user';
import { finalize, forkJoin } from 'rxjs';
import { StaticListItem } from '@interfaces/static-list.model';
import { CreateIpQuotationRequest, formatDateToSend } from '@interfaces/ip/quotation';

const TIMEOUT = environment.timeout;

@Component({
  selector: 'app-new-quotation-modal',
  templateUrl: './new-quotation-modal.component.html',
  styleUrl: './new-quotation-modal.component.scss'
})
export class NewQuotationModalComponent {
  //! Inyecciones
  private quoteRequestSV     = inject(IpQuoteRequestService);
  private ipQuotationSV      = inject(IpQuotationService);
  private clientSV           = inject(ClientsService);
  private userSV             = inject(UsersService);
  private ref                = inject(DynamicDialogRef);
  private staticListSV       = inject(StaticListsService);
  private storageSV          = inject(StorageService);
  private utilSV             = inject(UtilService);
  //! -----------------------------------------------------------
  //* Señales
  private _loading = signal<boolean>(true);
  loading = computed<boolean>(() => this._loading());
  private _listQR = signal<ListIpQuoteRequest[]>([]);
  listQR = computed<ListIpQuoteRequest[]>(() => this._listQR());
  private _listEmployees = signal<BasicUser[]>([]);
  listEmployees = computed<BasicUser[]>(() => this._listEmployees());
  listCurrency = computed<StaticListItem[]>(() => this.staticListSV.getListCurrency());
  private userData = computed<UserInfo | null>(() => this.storageSV.getPlain<UserInfo>(storageKeys.user_data.info));
  //*____________________________________________________________
  //? Variables
  oldKeyAutoCompleteClient: string = '';
  client: string = '';
  salesRep: string | null = '';
  viewCompletedQR: boolean = false;
  selectedQR: ListIpQuoteRequest[] = [];
  currency: string = 'USD';
  applicationAt: Date | null = null;
  //?------------------------------------------------------------

  constructor() {
    forkJoin({
      clients: this.clientSV.loadAllBasic(),
      employees: this.userSV.loadEmployees(false)
    }).subscribe({
      next: ({ employees }) => {
        this._listEmployees.set(employees);
        this.initModal();
      },
      error: err => {
        this.utilSV.setMessage('Error!', err, 'error');
        this.initModal();
      }
    });
  }

  private initModal(): void {
    this.currency = 'USD';
    this.salesRep = this.userData()?.id ?? '';
    this.disableLogin();
  }

  search() {
    if (this.client === '') return;
    this._loading.set(true);
    // Al refiltrar cambian los candidatos: se descartan las selecciones previas
    // para no llegar a enviar QR que ya no figuran en la tabla.
    this.selectedQR = [];
    this.quoteRequestSV.getListQuoteRequestByClientAvailableToQuotation(this.client, this.viewCompletedQR, this.currency, this.salesRep)
      .pipe(
        finalize(() => this.disableLogin())
      )
      .subscribe({
        next: resp => {
          this._listQR.set(resp);
        },
        error: err => {
          this.utilSV.setMessage('Error!', err, 'error');
        }
      });
  }
  clearClient() {
    this.client = '';
    this.selectedQR = [];
  }

  createQuotation() {
    if (this.client === '') return;
    this._loading.set(true);
    
    const data: CreateIpQuotationRequest = {
      clientId: this.client,
      currency: this.currency,
      paymentTerms: 'NET_30',
      incoterms: 'FOB',
      applicationAt: formatDateToSend(this.applicationAt),
      observations: ''
    };
    
    this.ipQuotationSV.createQuotation(data)
    .pipe(
      finalize(() => this.disableLogin())
    )
    .subscribe({
      next: resp => {
        const quotationId = resp.data.item.id;
        
        // If there are selected QRs, add them to the quotation
        if (this.selectedQR.length > 0) {
          const quoteRequestIds = this.selectedQR.map(qr => qr.id);
          this.ipQuotationSV.addQuoteRequestsToQuotation(quotationId, { quoteRequestIds })
          .subscribe({
            next: () => {
              this.utilSV.setMessage(resp.title, resp.message, 'success');
              setTimeout(() => {
                this.ref.close({
                  valid: true,
                  data: resp.data
                });
              }, TIMEOUT);
            },
            error: err => {
              this.utilSV.setMessage('Error!', err, 'error');
            }
          });
        } else {
          this.utilSV.setMessage(resp.title, resp.message, 'success');
          setTimeout(() => {
            this.ref.close({
              valid: true,
              data: resp.data
            });
          }, TIMEOUT);
        }
      },
      error: err => {
        this.utilSV.setMessage('Error!', err, 'error');
      }
    });
  }

  closeModal() {
    this.ref.close({valid: false});
  }

  searchByClient(event: KeyboardEvent) {
    if (event.key === 'Enter' && this.oldKeyAutoCompleteClient === 'Enter') {
      this.search();
      event.preventDefault();
    } else {
      this.oldKeyAutoCompleteClient = event.key;
    }
  }

  get filteredClients(): ClientBasic[] {
    return this.clientSV.filteredList;
  }

  searchClient(event: AutoCompleteCompleteEvent) {
    this.clientSV.searchAutoComplete(event);
  }

  private disableLogin() {
    setTimeout(() => {
      this._loading.set(false);
    }, TIMEOUT);
  }
}

