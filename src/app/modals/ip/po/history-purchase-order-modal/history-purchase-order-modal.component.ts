import { Component, inject, OnInit } from '@angular/core';
import { IpPurchaseOrderHistoryResponse } from '@interfaces/ip/purchaseOrder';
import { IpPurchaseOrderService } from '@services/ip';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-history-purchase-order-modal',
  templateUrl: './history-purchase-order-modal.component.html',
  styleUrl: './history-purchase-order-modal.component.scss'
})
export class HistoryPurchaseOrderModalComponent implements OnInit {

  //! Inyecciones
  private config = inject(DynamicDialogConfig);
  private poSV   = inject(IpPurchaseOrderService);
  //! -----------------------------------------------

  historyItems: IpPurchaseOrderHistoryResponse[] = [];
  loading: boolean = true;

  ngOnInit(): void {
    this.poSV.getPurchaseOrderHistory(this.config.data.purchaseOrderId).subscribe({
      next: resp => {
        resp.forEach(item => {
          if (item.action === 'UPDATE' || item.action === 'CHANGE_QUOTATION')
            item.data = this.transformDataToArray(item.data as Record<string, { new: unknown; old: unknown }>) as unknown as Record<string, unknown>;
        });
        this.historyItems = resp;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private transformDataToArray(data: Record<string, { new: unknown; old: unknown }>) {
    return Object.entries(data).map(([key, value]) => ({
      key,
      ...value
    }));
  }

  getActionDescription(action: string): string {
    const actionMap: Record<string, string> = {
      CREATE: 'CREATE',
      UPDATE: 'UPDATE',
      CLONE: 'CLONED',
      REJECTED: 'REJECTED',
      STATUS_CHANGE: 'STATUS CHANGE',
      ADD_PRODUCT: 'ADD PRODUCT',
      REMOVE_PRODUCT: 'REMOVE PRODUCT',
      UPDATE_PRODUCT: 'UPDATE PRODUCT',
      ADD_OTHER_CHARGE: 'ADD OTHER CHARGE',
      REMOVE_OTHER_CHARGE: 'REMOVE OTHER CHARGE',
      UPDATE_OTHER_CHARGE: 'UPDATE OTHER CHARGE',
      ADD_IMPORTED_Q_CHARGE: 'ADD IMPORTED Q CHARGE',
      REMOVE_IMPORTED_Q_CHARGE: 'REMOVE IMPORTED Q CHARGE',
      ADD_IMPORTED_QR_CHARGE: 'ADD IMPORTED QR CHARGE',
      REMOVE_IMPORTED_QR_CHARGE: 'REMOVE IMPORTED QR CHARGE',
      REMOVE_QUOTATION: 'REMOVE QUOTATION',
      CHANGE_QUOTATION: 'CHANGE QUOTATION',
    };
    return actionMap[action] ?? action;
  }

  getData(key: string) {
    const actionMap: Record<string, string> = {
      supplier: 'Supplier',
      supplierContact: 'Supplier Contact',
      supplierPoNumber: 'Supplier PO Number',
      clientPoNumber: 'Client PO Number',
      paymentTerms: 'Payment Terms',
      leadTime: 'Lead Time',
      leadTimeType: 'Lead Time Type',
      quotation: 'Quotation',
      currency: 'Currency',
      client: 'Client',
      salesRep: 'Sales Rep',
      incoterms: 'Incoterms',
      remarks: 'Remarks',
      internalRemarks: 'Internal Remarks',
      status: 'Status',
      value: 'Value',
      description: 'Description',
      number: 'Number',
    };
    return actionMap[key] ?? key;
  }

  getStatusColor(action: string): string {
    const tagMap: Record<string, string> = {
      CREATE: 'proposal',
      CLONE: 'proposal',
      UPDATE: 'new',
      CHANGE_QUOTATION: 'new',
      UPDATE_PRODUCT: 'new',
      UPDATE_OTHER_CHARGE: 'new',
      STATUS_CHANGE: 'renewal',
      ADD_PRODUCT: 'qualified',
      ADD_OTHER_CHARGE: 'qualified',
      ADD_IMPORTED_Q_CHARGE: 'qualified',
      ADD_IMPORTED_QR_CHARGE: 'qualified',
      REMOVE_PRODUCT: 'unqualified',
      REMOVE_OTHER_CHARGE: 'unqualified',
      REMOVE_IMPORTED_Q_CHARGE: 'unqualified',
      REMOVE_IMPORTED_QR_CHARGE: 'unqualified',
      REMOVE_QUOTATION: 'unqualified',
      REJECTED: 'unqualified',
    };
    return tagMap[action] ?? 'negotiation';
  }
}
