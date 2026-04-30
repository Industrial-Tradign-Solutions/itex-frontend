import { Injectable, Signal } from '@angular/core';
import { BaseService } from '@services/base-service.service';
import { environment } from '../../../environments/environment';
import { BasicBrand, Brand, BrandFilter, BrandRequest } from '@interfaces/masters/brands';
import { catchError, Observable, throwError } from 'rxjs';
import { Page } from '@interfaces/page.model';
import { MessageResponse } from '@interfaces/message-response';
import { storageKeys } from '../../../environments';
import { Supplier } from '@interfaces/partners/suppliers';

const URL_SERVICES = environment.api_url + 'master/brands';
const BRANDS_STORAGE_KEY = storageKeys.lists.list_brands;

@Injectable({
  providedIn: 'root'
})
export class BrandsService extends BaseService<Brand, BrandRequest, Brand, BasicBrand, {enableBrands: BasicBrand[], disableBrands: BasicBrand[]}>{

  constructor() {
    super(URL_SERVICES, BRANDS_STORAGE_KEY);
  }

  override listAll(): Observable<Brand[]> {
    throw Error('Funcion no implementada');
  }

  override update(id: string, request: BrandRequest): Observable<MessageResponse<Brand>> {
    throw Error('Funcion no implementada');
  }

  override findById(id: string): Observable<Brand> {
    throw Error('Funcion no implementada');
  }

  loadBrands(addDisables: boolean, disableBrands?: BasicBrand | BasicBrand[]): void {
    this.storageSV.delete(BRANDS_STORAGE_KEY);
    this.loadList(addDisables, this.getListBasicBrands.bind(this), disableBrands);
  }

  validateBrand(brandName: string): Observable<BasicBrand> {
    let url  = `${ URL_SERVICES }/validate-brand`;
    return this.http.post<BasicBrand>( url, brandName, {headers: this.authSV.headers()} )
    .pipe(
      catchError( err => throwError( () => err.error.errorMessage ))
    );
  }

  assignBrandSupplier(data: {brandId: string, supplierId: string}): Observable<MessageResponse<void>> {
    let url  = `${ URL_SERVICES }/assign-brand-supplier`;
    return this.http.post<MessageResponse<void>>( url, data, {headers: this.authSV.headers()} )
    .pipe(
      catchError( err => throwError( () => err.error.errorMessage ))
    );
  }

  importListBrands(request: BasicBrand[]): Observable<MessageResponse<BasicBrand[]>> {
    let url  = `${ URL_SERVICES }/import`;
    return this.http.post<MessageResponse<BasicBrand[]>>( url, request, {headers: this.authSV.headers()} )
    .pipe(
      catchError( err => throwError( () => err.error.errorMessage ))
    );
  }

  assignSupplierListBrands(request: BasicBrand[], supplierId: string): Observable<MessageResponse<BasicBrand[]>> {
    let url  = `${ URL_SERVICES }/assign-brand-supplier-list`;
    let data = {
      supplierId,
      brandIds: request.map(brand => brand.id)
    };
    return this.http.post<MessageResponse<BasicBrand[]>>( url, data, {headers: this.authSV.headers()} )
    .pipe(
      catchError( err => throwError( () => err.error.errorMessage ))
    );
  }

  validateBrandFile(file: FormData): Observable<BasicBrand[]> {
    let url  = `${ URL_SERVICES }/validate-import`;
    return this.http.post<BasicBrand[]>( url, file, {headers: this.authSV.headersMultipart()} )
    .pipe(
      catchError( err => throwError( () => err.error.errorMessage ))
    );
  }

  listAllBrandPage(filter: BrandFilter, page: number, size: number): Observable<Page<Brand>> {
    let url  = `${ URL_SERVICES }?page=${page}&size=${size}`;

    if (filter.name)
      url = `${url}&name=${filter.name}`;

    if (filter.shortBy)
      url = `${url}&shortBy=${filter.shortBy}`;

    if (filter.shortOrder)
      url = `${url}&shortOrder=${filter.shortOrder}`;

    return this.http.get<Page<Brand>>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  listSuppliersByBrandId(brandId: string): Observable<Supplier[]> {
    let url  = `${ URL_SERVICES }/list-suppliers/${brandId}`;
    return this.http.get<Supplier[]>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  unassignSupplierByBrandId(brandId: string, supplierId: string): Observable<MessageResponse<string>> {
    const url  = `${ URL_SERVICES }/unassign-supplier/${brandId}/${supplierId}`;
    return this.http.delete<MessageResponse<string>>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  private getListBasicBrands(lists: {enableBrands: BasicBrand[], disableBrands: BasicBrand[]}, addDisables: boolean): BasicBrand[] {
    let list = lists.enableBrands;
    if (addDisables){
      list = [...lists.enableBrands, ...lists.disableBrands]
    }
    return list;
  }

  get listBrands(): Signal<BasicBrand[]> {
    return this.list;
  }

  get filteredBrands(): BasicBrand[] {
    return this.filteredList;
  }

  addDisableItemAction(item: BasicBrand) {
    this.addDisableItem(item);
  }
}
