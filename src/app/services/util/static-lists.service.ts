import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthService } from '@services/security';
import { StorageService } from './storage.service';
import { environment } from '../../../environments/environment';
import { catchError, throwError } from 'rxjs';
import { storageKeys } from '../../../environments';
import { StaticList, StaticListItem } from '@interfaces/static-list.model';

const URL_SERVICES = environment.api_url + 'common/static_lists';
const STATIC_LISTS_NAMES = storageKeys.static_lists;

@Injectable({
  providedIn: 'root'
})
export class StaticListsService {

  //! Inyecciones
  private authSV     = inject(AuthService);
  private http       = inject(HttpClient);
  private storageSV  = inject(StorageService);
  //!---------------------------------------


  loadStaticList(): void {
    this.http.get<StaticList[]>( URL_SERVICES, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      ).subscribe({
        next: resp => {
          resp.forEach(item => {
            this.storageSV.set(`static_${item.name}`, item.items);
          });
        }
      });
  }

  getListClientStatus(): StaticListItem[] {
    return this.storageSV.getPlain<StaticListItem[]>(STATIC_LISTS_NAMES.client_status) ?? []
  }

  getListSupplierStatus(): StaticListItem[] {
    return this.storageSV.getPlain<StaticListItem[]>(STATIC_LISTS_NAMES.supplier_status) ?? [];
  }

  getListLanguages(): StaticListItem[] {
    return this.storageSV.getPlain<StaticListItem[]>(STATIC_LISTS_NAMES.language) ?? [];
  }

  getListPaymentTerms(): StaticListItem[] {
    return this.storageSV.getPlain<StaticListItem[]>(STATIC_LISTS_NAMES.payment_terms) ?? [];
  }

  getListPaymentMethods(): StaticListItem[] {
    return this.storageSV.getPlain<StaticListItem[]>(STATIC_LISTS_NAMES.payment_methods) ?? [];
  }

  getListPhoneTypes(): StaticListItem[] {
    return this.storageSV.getPlain<StaticListItem[]>(STATIC_LISTS_NAMES.phone_types) ?? [];
  }

  getListFreightClass(): StaticListItem[] {
    return this.storageSV.getPlain<StaticListItem[]>(STATIC_LISTS_NAMES.freight_class) ?? [];
  }

  getListIpProductsStatus(): StaticListItem[] {
    return this.storageSV.getPlain<StaticListItem[]>(STATIC_LISTS_NAMES.ip_products_status) ?? [];
  }

  getListCurrency(): StaticListItem[] {
    return this.storageSV.getPlain<StaticListItem[]>(STATIC_LISTS_NAMES.currency) ?? [];
  }

  getListUnitType(): StaticListItem[] {
    return this.storageSV.getPlain<StaticListItem[]>(STATIC_LISTS_NAMES.unit_type) ?? [];
  }

  getListIpQuoteRequestStatus(): StaticListItem[] {
    return this.storageSV.getPlain<StaticListItem[]>(STATIC_LISTS_NAMES.ip_quote_request_status) ?? [];
  }

  getListIpQuotationStatus(): StaticListItem[] {
    return this.storageSV.getPlain<StaticListItem[]>(STATIC_LISTS_NAMES.ip_quotation_status) ?? [];
  }

  getListIpPurchaseOrderStatus(): StaticListItem[] {
    return this.storageSV.getPlain<StaticListItem[]>(STATIC_LISTS_NAMES.ip_purchase_order_status) ?? [];
  }

  getListLeadTimeType(): StaticListItem[] {
    return this.storageSV.getPlain<StaticListItem[]>(STATIC_LISTS_NAMES.lead_time) ?? [];
  }

  getListIncoterms(): StaticListItem[] {
    return this.storageSV.getPlain<StaticListItem[]>(STATIC_LISTS_NAMES.incoterms) ?? [];
  }

  getListIpQuotationProductCondition(): StaticListItem[] {
    return this.storageSV.getPlain<StaticListItem[]>(STATIC_LISTS_NAMES.ip_quotation_product_condition) ?? [];
  }
}


