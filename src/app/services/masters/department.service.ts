import { Injectable, Signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { storageKeys } from '../../../environments/storage-keys';
import { Observable, catchError, throwError } from 'rxjs';
import { BasicDepartment, Department, DepartmentRequest, ListsDepartments } from '@interfaces/masters/departments';
import { BaseService } from '@services/base-service.service';

const URL_SERVICES = environment.api_url + 'master/departments';
const LIST_DEPARTMENTS_KEY = storageKeys.lists.list_departmens;

@Injectable({
  providedIn: 'root'
})
export class DepartmentService extends BaseService<Department, DepartmentRequest, Department, BasicDepartment, ListsDepartments>{

  constructor() {
    super(URL_SERVICES, LIST_DEPARTMENTS_KEY);
  }

  listClientInfoTrue(): Observable<BasicDepartment[]> {
    const url  = `${ URL_SERVICES }/show_info?clientInfo=true`;
    return this.listShowInfo(url);
  }

  listSupplierInfoTrue(): Observable<BasicDepartment[]> {
    const url  = `${ URL_SERVICES }/show_info?supplierInfo=true`;
    return this.listShowInfo(url);
  }
  private listShowInfo(url: string): Observable<BasicDepartment[]> {
    return this.http.get<BasicDepartment[]>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  loadDepartments(addDisables: boolean, disableDepartment?: BasicDepartment | BasicDepartment[]): void {
    this.loadList(addDisables, this.getListBasicDepartments.bind(this), disableDepartment);
  }

  get listDepartments(): Signal<BasicDepartment[]> {
    return this.list;
  }

  get filteredDepartments(): BasicDepartment[] {
    return this.filteredList;
  }

  private getListBasicDepartments(lists: ListsDepartments, addDisables: boolean): BasicDepartment[] {
    let list = lists.enables;
    if (addDisables){
      list = [...lists.enables, ...lists.disables]
    }
    return list;
  }
}
