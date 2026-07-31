import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Messages } from '@config/messages';
import { CommonPageTab } from '@config/tabs/commonPageTab';
import { Invoice, ListInvoice } from '@interfaces/sales/invoice';
import { InvoicePermissions } from '@pages/principal/sales/invoices/invoices.component';
import { InvoiceService } from '@services/sales';

const MESSAGES = Messages.pages.sales.invoice;

/**
 * Placeholder tab of an invoice. The form itself is not built yet, but the tab
 * still performs the full open-lock lifecycle (lock on open, `isValidOpen`
 * downgrade to read-only, unlock on close) so `load-open` / `close-list` behave
 * exactly like in PO/Q/QR.
 */
@Component({
  selector: 'app-form-invoice',
  templateUrl: './form-invoice.component.html',
  styleUrl: './form-invoice.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormInvoiceComponent extends CommonPageTab<ListInvoice, InvoicePermissions, Invoice> implements OnInit {

  private invoiceSV = inject(InvoiceService);

  constructor() {
    super(MESSAGES);
  }

  ngOnInit(): void {
    this.onInitAction({
      updatePermission: this.permissions().updateInvoice,
      openAndLock: this.invoiceSV.openAndLockInvoice(this.tabItem.item.id, this.tabItem.type),
      module: 'INV'
    });
  }

  protected getRequest(): any {
    return {};
  }

  // The base class subscribes to `formTab.valueChanges` to track pristine state,
  // so an empty FormGroup is still required while the form has no fields.
  protected buildFormAction(): void {
    this.formTab = this.formBuilder.group({});
  }

  protected enableForm(): void {
    // No fields to enable/disable yet.
  }

  onSubmit(): void {
    // Nothing to submit yet.
  }

}
