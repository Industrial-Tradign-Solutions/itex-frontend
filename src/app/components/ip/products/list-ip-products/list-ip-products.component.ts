import { Component, computed, inject } from '@angular/core';
import { CommonListTab } from '@config/tabs/commonListTab';
import { TypeTab } from '@config/types/tabs';
import { IpProductsFilter, ListIpProduct } from '@interfaces/ip/products';
import { StaticListItem } from '@interfaces/static-list.model';
import { IpProductsPermissions } from '@pages/principal/ip/products/products.component';
import { IpProductsService } from '@services/ip';
import { BrandsService } from '@services/masters';
import { SortEvent } from 'primeng/api';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';

@Component({
  selector: 'app-list-ip-products',
  templateUrl: './list-ip-products.component.html',
  styleUrl: './list-ip-products.component.scss'
})
export class ListIpProductsComponent extends CommonListTab<ListIpProduct, IpProductsPermissions>{

  //! Inyecciones___________________________________
  private ipProductSV   = inject(IpProductsService);
  private brandSV       = inject(BrandsService);
  //! ----------------------------------------------

  //* Señales
  listIpProductStatus = computed<StaticListItem[]>(() => this.staticListSV.getListIpProductsStatus());
  listIpProductFreightClass = computed<StaticListItem[]>(() => this.staticListSV.getListFreightClass());
  //* -----------------------------------------------------------

  //? Variables
  oldKeyAutoCompleteBrand: string = '';
  //?------------------------------------------------------------

  constructor() {
    super();
    this.brandSV.loadBrands(true);
    this.formBuild();
  }

  customSort(event: SortEvent) {
    this.sort(event, this.search.bind(this));
  }

  search(resetPaginator: boolean, page: number = 0, size: number = 10) {
    if(resetPaginator && this.page().content.length > 0 && this.page().page.totalPages > 1) {
      this.paginator.changePage(0);
    }
    const filters: IpProductsFilter = this.formFilter?.value;
    if (filters.brandId) {
      if (!this.utilSV.validateUUID(filters.brandId)) {
        filters.brandId = undefined;
      }
    }
    this.disableShort = true;
    this.searchAction(this.ipProductSV.listAllProductsPage(filters, page, size));
  }

  newProduct() {
    this.new({
      id: '',
      name: 'New Product',
      description: 'New Product'
    });
  }

  openProduct(product: ListIpProduct, type: TypeTab) {
    this.open({item: product, type: (product.status === 'SUBSTITUTED' ? 'view' : type), pristine: true})
  }

  searchByBrand(event: KeyboardEvent) {
    this.searchBy(event, this.oldKeyAutoCompleteBrand, this.search.bind(this));
  }

  get filteredBrands() {
    return this.brandSV.filteredBrands;
  }

  searchBrand(event: AutoCompleteCompleteEvent) {
    this.brandSV.searchAutoComplete(event);
  }

  getStatusColor(status: 'ACTIVE' | 'INACTIVE' | 'SUBSTITUTED'): string {
    if (status === 'ACTIVE') {
      return 'qualified';
    } else if (status === 'INACTIVE') {
      return 'unqualified';
    } else if (status === 'SUBSTITUTED') {
      return 'renewal';
    } else {
      return 'new';
    }
  }

  getFreightClass(freightClass: string | null): string {
    return freightClass ? this.listIpProductFreightClass().find(item => item.key === freightClass)?.value ?? '' : '';
  }

  changePage(event: any) {
    this.search(false, event.page, event.rows);
  }

  private formBuild(): any {
    this.formFilter = this.formBuilder.group({
      brandId: [
        null,
        []
      ],
      description: [
        null,
        []
      ],
      mfrReference: [
        null,
        []
      ],
      nmfc: [
        null,
        []
      ],
      freightClass: [
        null,
        []
      ],
      status: [
        null,
        []
      ],
      notesKeywords: [
        null
      ],
      shortBy: [
        null,
        []
      ],
      shortOrder: [
        null,
        []
      ]
    });
  }
}
