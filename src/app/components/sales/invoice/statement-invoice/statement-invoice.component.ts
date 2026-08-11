import { ChangeDetectionStrategy, Component, computed, EventEmitter, inject, Output, signal } from '@angular/core';
import { TitlesMessages } from '@config/messages';
import { EmitedTab } from '@config/types/tabs';
import { ClientBasic } from '@interfaces/partners/clients';
import { InvoiceStatement, invoiceStatusBadge, invoiceStatusLabel, invoiceTabName, ListInvoice } from '@interfaces/sales/invoice';
import { ClientsService } from '@services/partners';
import { InvoiceService } from '@services/sales';
import { UtilService } from '@services/util';
import { AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { finalize } from 'rxjs';

const TITLES = TitlesMessages;

// Buckets of §18.2, in the order they have to be read: what is not due yet
// first, then how far past due the rest is.
type AgingBucket = {
  label: string;
  value: number;
};

/**
 * Client account statement (§18.2): what has been invoiced, what has been
 * collected, and how old the outstanding balance is.
 *
 * It is a read-only aggregate over invoices that were actually issued — drafts
 * and cancelled invoices are excluded server-side — and it applies the same
 * per-sales-rep scope as the list, so two users can legitimately see different
 * figures for the same client.
 *
 * Lives as a fixed tab of the module instead of an entry in `tabs()`: it is not
 * an invoice, holds no lock, and must not compete for the open-tabs budget.
 */
@Component({
  selector: 'app-statement-invoice',
  templateUrl: './statement-invoice.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatementInvoiceComponent {

  private invoiceSV = inject(InvoiceService);
  private clientSV  = inject(ClientsService);
  private utilSV    = inject(UtilService);

  @Output() opened = new EventEmitter<EmitedTab<ListInvoice>>();

  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());

  private _statement = signal<InvoiceStatement | undefined>(undefined);
  statement = computed<InvoiceStatement | undefined>(() => this._statement());

  clientId = signal<string | null>(null);

  // Own state, never `clientSV.filteredList`: that field lives on a
  // root-provided singleton shared with every other open module.
  filteredClients: ClientBasic[] = [];

  aging = computed<AgingBucket[]>(() => {
    const aging = this._statement()?.aging;
    if (!aging) return [];

    return [
      { label: 'Current', value: aging.current },
      { label: '1 - 30 days', value: aging.days1To30 },
      { label: '31 - 60 days', value: aging.days31To60 },
      { label: '61 - 90 days', value: aging.days61To90 },
      { label: 'Over 90 days', value: aging.days90Plus }
    ];
  });

  overdueInvoices = computed<ListInvoice[]>(() => this._statement()?.overdueInvoices ?? []);

  constructor() {
    this.clientSV.loadAllBasic();
  }

  searchClient(event: AutoCompleteCompleteEvent): void {
    this.filteredClients = this.clientSV.searchAutoComplete(event);
  }

  selectClient(event: AutoCompleteSelectEvent): void {
    const client = event.value as ClientBasic;
    this.clientId.set(client.id);
    this.loadStatement(client.id);
  }

  clearClient(): void {
    this.clientId.set(null);
    this._statement.set(undefined);
  }

  reload(): void {
    const clientId = this.clientId();
    if (clientId) this.loadStatement(clientId);
  }

  // The rows come from the list projection, so the tab opens exactly like it
  // would from the list. Read-only: the statement never takes a lock.
  openInvoice(invoice: ListInvoice): void {
    this.opened.emit({
      item: { ...invoice, name: invoiceTabName(invoice) },
      type: 'view',
      pristine: true
    });
  }

  statusBadge(invoice: ListInvoice): string {
    return invoiceStatusBadge(invoice.status);
  }

  statusLabel(invoice: ListInvoice): string {
    return invoiceStatusLabel(invoice.status);
  }

  private loadStatement(clientId: string): void {
    this._loading.set(true);
    this.invoiceSV.getClientStatement(clientId)
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: resp => this._statement.set(resp),
        error: err => {
          this._statement.set(undefined);
          this.utilSV.setMessage(TITLES.error, err?.errorMessage ?? err, 'error');
        }
      });
  }

}
