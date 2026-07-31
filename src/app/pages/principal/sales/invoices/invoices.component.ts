import { afterNextRender, ChangeDetectionStrategy, Component, computed, HostListener, inject, Injector, OnDestroy, OnInit, signal } from '@angular/core';
import { cardEnter } from '@config/animations/invoice.animations';
import { Messages, TitlesMessages } from '@config/messages';
import { CommonTabs } from '@config/tabs/commonTabsOpen';
import { EmitedTab } from '@config/types/tabs';
import { ListInvoice } from '@interfaces/sales/invoice';
import { InvoiceService } from '@services/sales';
import { PermissionService } from '@services/security';
import { TabViewCloseEvent } from 'primeng/tabview';
import { moduleActionsId } from '../../../../../environments';
import { environment } from '../../../../../environments/environment';

const INVOICE_ACTIONS_ID = moduleActionsId.sales.invoices;
const TABS_MESSAGES      = Messages.config.tabs;
const TITLES             = TitlesMessages;

@Component({
  selector: 'app-invoices',
  templateUrl: './invoices.component.html',
  styleUrl: './invoices.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [cardEnter]
})
export class InvoicesComponent extends CommonTabs<ListInvoice> implements OnInit, OnDestroy {

  constructor() {
    super('Invoices');
  }

  private permissionsSV = inject(PermissionService);
  private invoiceSV     = inject(InvoiceService);
  private injector      = inject(Injector);

  // Own signal instead of the plain `activeTab` field of the base class:
  // a plain property never marks an OnPush component dirty.
  activeTabIndex = signal<number>(0);

  private _invoicePermissions = signal<InvoicePermissions>({
    createInvoice: false,
    updateInvoice: false,
    viewHistoryInvoice: false,
    cloneInvoice: false,
    cancelInvoice: false,
    editPaymentTermsInvoice: false,
    viewInvoice: false,
    issueInvoice: false,
    registerPaymentInvoice: false,
    deleteInvoice: false,
    revertInvoiceToDraft: false,
    voidPaymentInvoice: false,
    viewAllInvoice: false
  });
  invoicePermissions = computed<InvoicePermissions>(() => this._invoicePermissions());

  ngOnInit(): void {
    this._loading.set(true);
    this.loadListPermissionsInvoice();
    if (!this.isOpenModule) {
      this.loadOpenInvoices();
    }
  }

  ngOnDestroy(): void {
    this.destroyPage();
  }

  loadOpenInvoices() {
    this.invoiceSV.loadOpenInvoices().subscribe({
      next: resp => {
        if (resp && resp.length > 0) {
          this.openModalConfirmationOpenClose(resp, this.invoiceSV.closeListInvoices());
        } else {
          this._loading.set(false);
        }
      },
      error: () => this._loading.set(false)
    });
  }

  // Immutable replacement of CommonTabs.openTab: the base pushes into the array
  // held by the signal, which keeps the same reference and never notifies the
  // `tabs` computed under OnPush.
  override openTab(emited: EmitedTab<ListInvoice>): void {
    const openedIndex = this.tabs().findIndex(tab => tab.item.id === emited.item.id);

    if (openedIndex !== -1) {
      this.focusTab(openedIndex + 1);
      return;
    }

    if (this.tabs().length >= environment.max_open_tabs) {
      this.utilSV.setMessage(TITLES.warning, TABS_MESSAGES.max_open_tabs(this.moduleName()), 'warn');
      return;
    }

    this._tabs.update(tabs => [...tabs, emited]);
    this.focusTab(this.tabs().length);
  }

  closeTab(event: TabViewCloseEvent | { index: number }): void {
    const index = event.index - 1;
    const tab   = this.tabs()[index];

    if (!tab) {
      return;
    }

    if (tab.pristine) {
      this.removeTab(index, tab);
      return;
    }

    this.utilSV.confirm({
      message: TABS_MESSAGES.close_tab_action(tab.item.name),
      header: TITLES.save_changes,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes',
      rejectLabel: 'No',
      accept: () => this.removeTab(index, tab)
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification(event: any): void {
    this.destroyPage();
  }

  private removeTab(index: number, tab: EmitedTab<ListInvoice>): void {
    (document.activeElement as HTMLElement)?.blur();
    this._tabs.update(tabs => tabs.filter((_, position) => position !== index));
    this.activeTabIndex.set(0);

    if (tab.type === 'edit') {
      this.invoiceSV.closeInvoice(tab.item.id).subscribe();
    }
  }

  // p-tabView only honours `activeIndex` once the new panel is registered in its
  // content QueryList, so the index is set after the render instead of guessing
  // a timeout.
  private focusTab(index: number): void {
    afterNextRender(() => this.activeTabIndex.set(index), { injector: this.injector });
  }

  private destroyPage(): void {
    const hasOpenTabs = this.tabs().length > 0;
    this.dismissNavTab(hasOpenTabs ? this.invoiceSV.closeListInvoices() : undefined);
  }

  private async loadListPermissionsInvoice(): Promise<void> {
    this._invoicePermissions.set({
      createInvoice: await this.permissionsSV.isValidAction(INVOICE_ACTIONS_ID.CREATE_INVOICE),
      updateInvoice: await this.permissionsSV.isValidAction(INVOICE_ACTIONS_ID.UPDATE_INVOICE),
      viewHistoryInvoice: await this.permissionsSV.isValidAction(INVOICE_ACTIONS_ID.VIEW_HISTORY_INVOICE),
      cloneInvoice: await this.permissionsSV.isValidAction(INVOICE_ACTIONS_ID.CLONE_INVOICE),
      cancelInvoice: await this.permissionsSV.isValidAction(INVOICE_ACTIONS_ID.CANCEL_INVOICE),
      editPaymentTermsInvoice: await this.permissionsSV.isValidAction(INVOICE_ACTIONS_ID.EDIT_PAYMENT_TERMS_INVOICE),
      viewInvoice: await this.permissionsSV.isValidAction(INVOICE_ACTIONS_ID.VIEW_INVOICE),
      issueInvoice: await this.permissionsSV.isValidAction(INVOICE_ACTIONS_ID.ISSUE_INVOICE),
      registerPaymentInvoice: await this.permissionsSV.isValidAction(INVOICE_ACTIONS_ID.REGISTER_PAYMENT_INVOICE),
      deleteInvoice: await this.permissionsSV.isValidAction(INVOICE_ACTIONS_ID.DELETE_INVOICE),
      revertInvoiceToDraft: await this.permissionsSV.isValidAction(INVOICE_ACTIONS_ID.REVERT_INVOICE_TO_DRAFT),
      voidPaymentInvoice: await this.permissionsSV.isValidAction(INVOICE_ACTIONS_ID.VOID_PAYMENT_INVOICE),
      viewAllInvoice: await this.permissionsSV.isValidAction(INVOICE_ACTIONS_ID.VIEW_ALL_INVOICE)
    });
  }

}

export type InvoicePermissions = {
  createInvoice: boolean;
  updateInvoice: boolean;
  viewHistoryInvoice: boolean;
  cloneInvoice: boolean;
  cancelInvoice: boolean;
  editPaymentTermsInvoice: boolean;
  viewInvoice: boolean;
  issueInvoice: boolean;
  registerPaymentInvoice: boolean;
  deleteInvoice: boolean;
  revertInvoiceToDraft: boolean;
  voidPaymentInvoice: boolean;
  viewAllInvoice: boolean;
}
