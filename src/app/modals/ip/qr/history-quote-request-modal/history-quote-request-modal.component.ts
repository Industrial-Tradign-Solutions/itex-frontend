import { Component, inject, OnInit } from '@angular/core';
import { IpQuoteRequestHistoryResponse } from '@interfaces/ip/quoteRequest';
import { IpQuoteRequestService } from '@services/ip';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-history-quote-request-modal',
  templateUrl: './history-quote-request-modal.component.html',
  styleUrl: './history-quote-request-modal.component.scss'
})
export class HistoryQuoteRequestModalComponent implements OnInit {

  //! Inyecciones
  private config         = inject(DynamicDialogConfig);
  private quoteRequestSV = inject(IpQuoteRequestService);
  //! -----------------------------------------------

  historyItems: IpQuoteRequestHistoryResponse[] = [];
  loading: boolean = true;

  ngOnInit(): void {
    this.quoteRequestSV.getQuoteRequestHistory(this.config.data.quoteRequestId).subscribe({
      next: resp => {
        resp.forEach(item => {
          if (item.action === 'UPDATE')
            item.data = this.transformDataToArray(item.data as Record<string, { new: unknown; old: unknown }>);
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
      QUOTED: 'QUOTED',
      ADD_PRODUCT: 'ADD PRODUCT',
      REMOVE_PRODUCT: 'REMOVE PRODUCT',
      UPDATE_PRODUCT: 'UPDATE PRODUCT',
      ADD_OTHER_CHARGE: 'ADD OTHER CHARGE',
      REMOVE_OTHER_CHARGE: 'REMOVE OTHER CHARGE',
      UPDATE_OTHER_CHARGE: 'UPDATE OTHER CHARGE',
    };
    return actionMap[action] ?? action;
  }

  getData(key: string) {
    const actionMap: Record<string, string> = {
      client: 'Client',
      salesRep: 'Sales Rep',
      supplier: 'Supplier',
      currency: 'Currency',
      status: 'Status',
      number: 'Number',
      total: 'Total',
      paymentTerms: 'Payment Terms',
      clientContact: 'Client Contact',
      clientAddress: 'Client Address',
      clientQrNumber: 'Client QR Number',
      supplierQrNumber: 'Supplier QR Number',
      freightClass: 'Freight Class',
      freightCharges: 'Freight Charges',
      fobShippingPoint: 'FOB Shipping Point',
      shippingPointZipCode: 'Shipping Point Zip Code',
      remarks: 'Remarks',
      internalRemarks: 'Internal Remarks',
      quantity: 'Quantity',
      unitType: 'Unit Type',
      unitPrice: 'Unit Price',
      extendedPrice: 'Extended Price',
      leadTime: 'Lead Time',
      grossWeightLbs: 'Gross Weight (lbs)',
      value: 'Value',
      description: 'Description',
    };
    return actionMap[key] ?? key;
  }

  getStatusColor(action: string): string {
    const tagMap: Record<string, string> = {
      CREATE: 'proposal',
      CLONE: 'proposal',
      UPDATE: 'new',
      UPDATE_PRODUCT: 'new',
      UPDATE_OTHER_CHARGE: 'new',
      QUOTED: 'renewal',
      ADD_PRODUCT: 'qualified',
      ADD_OTHER_CHARGE: 'qualified',
      REMOVE_PRODUCT: 'unqualified',
      REMOVE_OTHER_CHARGE: 'unqualified',
      REJECTED: 'unqualified',
    };
    return tagMap[action] ?? 'negotiation';
  }
}
