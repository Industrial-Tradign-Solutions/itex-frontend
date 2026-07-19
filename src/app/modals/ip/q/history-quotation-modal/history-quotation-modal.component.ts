import { Component, inject, OnInit } from '@angular/core';
import { IpQuotationHistoryResponse } from '@interfaces/ip/quotation';
import { IpQuotationService } from '@services/ip';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-history-quotation-modal',
  templateUrl: './history-quotation-modal.component.html',
  styleUrl: './history-quotation-modal.component.scss'
})
export class HistoryQuotationModalComponent implements OnInit {

  //! Inyecciones
  private config      = inject(DynamicDialogConfig);
  private quotationSV = inject(IpQuotationService);
  //! -----------------------------------------------

  historyItems: IpQuotationHistoryResponse[] = [];
  loading: boolean = true;

  ngOnInit(): void {
    this.quotationSV.getQuotationHistory(this.config.data.quotationId).subscribe({
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
      STATUS_CHANGE: 'STATUS CHANGE',
      ADD_PRODUCT: 'ADD PRODUCT',
      REMOVE_PRODUCT: 'REMOVE PRODUCT',
      UPDATE_PRODUCT: 'UPDATE PRODUCT',
      ADD_QR: 'ADD QUOTE REQUEST',
      REMOVE_QR: 'REMOVE QUOTE REQUEST',
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
      currency: 'Currency',
      status: 'Status',
      number: 'Number',
      paymentTerms: 'Payment Terms',
      clientContact: 'Client Contact',
      clientQNumber: 'Client Q Number',
      leadTime: 'Lead Time',
      leadTimeType: 'Lead Time Type',
      validity: 'Validity',
      validityType: 'Validity Type',
      incoterms: 'Incoterms',
      remarks: 'Remarks',
      internalRemarks: 'Internal Remarks',
      value: 'Value',
      description: 'Description',
      profitMargin: 'Profit Margin',
      lineNumber: 'Line Number',
      condition: 'Condition',
      productReference: 'Product Reference',
      productDescription: 'Product Description',
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
      STATUS_CHANGE: 'renewal',
      ADD_PRODUCT: 'qualified',
      ADD_QR: 'qualified',
      ADD_OTHER_CHARGE: 'qualified',
      REMOVE_PRODUCT: 'unqualified',
      REMOVE_QR: 'unqualified',
      REMOVE_OTHER_CHARGE: 'unqualified',
      REJECTED: 'unqualified',
    };
    return tagMap[action] ?? 'negotiation';
  }
}
