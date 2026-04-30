import { HttpClient } from "@angular/common/http";
import { computed, inject, signal } from "@angular/core";
import { MessageResponse } from "@interfaces/message-response";
import { AuthService } from "@services/security";
import { StorageService, UtilService } from "@services/util";
import { AutoCompleteCompleteEvent } from "primeng/autocomplete";
import { catchError, map, Observable, of, tap, throwError } from "rxjs";

export abstract class BaseService<ENTITY, REQUEST, LIST_ALL, BASIC, LISTS> {

  //! Inyecciones
  protected authSV     = inject(AuthService);
  protected http       = inject(HttpClient);
  protected storageSV  = inject(StorageService);
  protected utilSV     = inject(UtilService)
  //!----------------------------

  private _list = signal<BASIC[]>([]);
  protected list = computed<BASIC[]>(() => this._list());
  protected filteredList: BASIC[] = [];

  private base_url: string = '';
  private basic_list_key: string = '';

  constructor(url: string, key: string) {
    this.base_url = url;
    this.basic_list_key = key;
  }

  protected loadList(addDisables: boolean, getLists: (lists: LISTS, addDisables: boolean) => BASIC[], disableItem?: BASIC | BASIC[]) {
    this.listBasicsFun(addDisables, getLists).subscribe({
      next: resp => {
        if (!disableItem) {
          this._list.set(resp);
        } else {
          this._list.set(Array.isArray(disableItem) ? [...resp, ...disableItem] : [...resp, disableItem]);
        }
      }
    });
  }

  protected addDisableItem(item: BASIC) {
    this._list().push(item);
  }

  searchAutoComplete(event: AutoCompleteCompleteEvent) {
    let filtered: BASIC[] = [];
    let query = event.query;

    for (let i = 0; i < (this.list() as any[]).length; i++) {
      let item = (this.list() as any[])[i];
      if (item.name.toLowerCase().indexOf(query.toLowerCase()) == 0) {
          filtered.push(item);
      }
    }
    this.filteredList = filtered;
  }

  create(request: REQUEST): Observable<MessageResponse<ENTITY>> {
    const url  = `${ this.base_url }/create`;
    return this.http.post<MessageResponse<ENTITY>>( url, request, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  update(id: string, request: REQUEST): Observable<MessageResponse<ENTITY>> {
    const url  = `${ this.base_url }/update/${id}`;
    return this.http.put<MessageResponse<ENTITY>>( url, request, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  listAll(): Observable<LIST_ALL[]> {
    const url  = `${ this.base_url }`;
    return this.http.get<LIST_ALL[]>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

 disable(id: string): Observable<MessageResponse<string>> {
    const url  = `${ this.base_url }/disable/${id}`;
    return this.http.delete<MessageResponse<string>>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  enable(id: string): Observable<MessageResponse<string>> {
    const url  = `${ this.base_url }/enable/${id}`;
    return this.http.patch<MessageResponse<string>>( url, {}, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  findById(id: string): Observable<ENTITY> {
    const url  = `${ this.base_url }/${id}`;
    return this.http.get<ENTITY>( url, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  private listBasicsFun(addDisables: boolean, getLists: (lists: LISTS, addDisables: boolean) => BASIC[]): Observable<BASIC[]> {
    const lists = this.storageSV.getPlain<LISTS>(this.basic_list_key);
    if (lists) return of(getLists(lists, addDisables));

    const url  = `${ this.base_url }/basic`;
    return this.http.get<LISTS>( url, {headers: this.authSV.headers()} )
      .pipe(
        tap(lists => this.storageSV.set(this.basic_list_key, lists)),
        map(lists => getLists(lists, addDisables)),
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }
}
