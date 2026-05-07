import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { ClientBasic } from '@interfaces/partners/clients';
import { IpQuotationService, IpQuoteRequestService } from '@services/ip';
import { ClientsService } from '@services/partners';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { environment } from '../../../../../environments/environment';
import { ListIpQuoteRequest } from '@interfaces/ip/quoteRequest';
import { finalize } from 'rxjs';
import { StaticListItem } from '@interfaces/static-list.model';
import { StaticListsService } from '../../../../services/util/static-lists.service';
import { CreateIpQuotationRequest } from '@interfaces/ip/quotation';
import { UtilService } from '../../../../services/util/util.service';

const TIMEOUT = environment.timeout;

@Component({
  selector: 'app-new-quotation-modal',
  templateUrl: './new-quotation-modal.component.html',
  styleUrl: './new-quotation-modal.component.scss'
})
export class NewQuotationModalComponent implements OnInit {
  //! Inyecciones
  private quoteRequestSV     = inject(IpQuoteRequestService);
  private ipQuotationSV      = inject(IpQuotationService);
  private clientSV           = inject(ClientsService);
  private ref                = inject(DynamicDialogRef);
  private staticListSV       = inject(StaticListsService);
  private utilSV             = inject(UtilService);
  //! -----------------------------------------------------------
  //* Señales
  private _loading = signal<boolean>(true);
  loading = computed<boolean>(() => this._loading());
  private _listQR = signal<ListIpQuoteRequest[]>([]);
  listQR = computed<ListIpQuoteRequest[]>(() => this._listQR());
  listCurrency = computed<StaticListItem[]>(() => this.staticListSV.getListCurrency());
  //*____________________________________________________________
  //? Variables
  oldKeyAutoCompleteClient: string = '';
  client: string = '';
  viewCompletedQR: boolean = false;
  selectedQR: ListIpQuoteRequest[] = [];
  currency!: any;
  //?------------------------------------------------------------

  constructor() {
    this.clientSV.loadAllBasic();
  }

  ngOnInit(): void {
    this.currency = 'USD';
    this.disableLogin();
  }

  search() {
    if (this.client === '') return;
    this._loading.set(true);
    this.quoteRequestSV.getListQuoteRequestByClientAvailableToQuotation(this.client, this.viewCompletedQR, this.currency)
      .pipe(
        finalize(() => this.disableLogin())
      )
      .subscribe({
        next: resp => {
          this._listQR.set(resp);
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

  getStatusColor(status: 'CREATED' | 'SENT' | 'REJECTED' | 'ANSWERED' | 'COMPLETE'): string {
    if (status === 'CREATED') {
      return 'new';
    } else if (status === 'REJECTED') {
      return 'unqualified';
    } else if (status === 'SENT') {
      return 'renewal';
    } else if (status === 'ANSWERED') {
      return 'negotiation';
    } else if (status === 'COMPLETE') {
      return 'qualified';
    } else {
      return 'new';
    }
  }
}
