import { Component, inject, OnInit } from '@angular/core';
import { IpProductsHistory } from '@interfaces/ip/products';
import { IpProductsService } from '@services/ip';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-history-ip-product-modal',
  templateUrl: './history-ip-product-modal.component.html',
  styleUrl: './history-ip-product-modal.component.scss'
})
export class HistoryIpProductModalComponent implements OnInit {

  //! Inyecciones
  private config      = inject(DynamicDialogConfig);
  private ref         = inject(DynamicDialogRef);
  private productSV   = inject(IpProductsService);
  //! -----------------------------------------------

  historyItems: IpProductsHistory[] = [];
  loading: boolean = true;

  ngOnInit(): void {
    this.productSV.getProductHistory(this.config.data.productId).subscribe({
      next: resp => {
        setTimeout(() => {
          this.historyItems = resp;
          this.loading = false;
        }, 1000);
      }
    });
  }

  getActionDescription(action: string): string {
    const actionMap: Record<string, string> = {
      IMPORT_PRODUCT: 'CREATE',
      ADD_SURPLUS: 'ADD SURPLUS',
      REMOVE_SURPLUS: 'REMOVE SURPLUS',
      REPLACE: 'SUBSTITUTED',
      DISABLE: 'INACTIVE',
      ENABLE: 'ACTIVE',
    };
    return actionMap[action] ?? action;
  }

  getData(key: string) {
    const actionMap: Record<string, string> = {
      brand: 'Brand',
      description: 'Description',
      clientDescription: 'Client Description',
      mfrReference: 'MFR Reference',
      clientReference: 'Client Reference',
      netWeightLbs: 'Net Weight (lbs)',
      nmfc: 'NMFC',
      freightClass: 'Freight Class',
      notes: 'Notes',
      keywords: 'Keywords',
      htsScheduleBNumber: 'HTS #',
      eccn: 'ECCN',
      coo: 'COO',
      battery: 'Batery',
      hazmat: 'Hazmat',
      dualUse: 'Dual Use',
    };
    return actionMap[key] ?? key;
  }

  getStatusColor(action: string): string {
    const tagMap: Record<string, string> = {
      ADD_SURPLUS: 'qualified',
      ENABLE: 'qualified',
      DISABLE: 'unqualified',
      REMOVE_SURPLUS: 'unqualified',
      REPLACE: 'renewal',
      CREATE: 'proposal',
      IMPORT_PRODUCT: 'proposal',
      UPDATE: 'new',
    };

    return tagMap[action] ?? 'negotiation';
  }
}
