import { HttpClient } from "@angular/common/http";
import { computed, inject, signal } from "@angular/core";
import { MessageResponse } from "@interfaces/message-response";
import { AuthService } from "@services/security";
import { UtilService } from "@services/util";
import { AutoCompleteCompleteEvent } from "primeng/autocomplete";
import { catchError, map, Observable, tap, throwError } from "rxjs";

export abstract class BaseService<ENTITY, REQUEST, LIST_ALL, BASIC, LISTS> {

  //! Inyecciones
  protected authSV     = inject(AuthService);
  protected http       = inject(HttpClient);
  protected utilSV     = inject(UtilService)
  //!----------------------------

  private _list = signal<BASIC[]>([]);
  protected list = computed<BASIC[]>(() => this._list());
  protected filteredList: BASIC[] = [];

  private base_url: string = '';

  constructor(url: string) {
    this.base_url = url;
  }

  protected loadList(
    addDisables: boolean,
    getLists: (lists: LISTS, addDisables: boolean) => BASIC[],
    disableItem?: BASIC | BASIC[]
  ): Observable<BASIC[]> {
    const url  = `${ this.base_url }/basic`;
    return this.http.get<LISTS>( url, {headers: this.authSV.headers()} )
      .pipe(
        map(lists => {
          const list = getLists(lists, addDisables);
          if (!disableItem) return list;
          return Array.isArray(disableItem) ? [...list, ...disableItem] : [...list, disableItem];
        }),
        tap(list => this._list.set(list)),
        catchError( err => throwError( () => err.error.errorMessage ))
      );
  }

  protected addDisableItem(item: BASIC) {
    this._list.update(list => [...list, item]);
  }

  searchAutoComplete(event: AutoCompleteCompleteEvent) {
    const query = (event.query ?? '').toLowerCase();
    this.filteredList = this.list().filter(item => {
      const name = (item as Record<string, unknown>)['name'];
      return typeof name === 'string' && name.toLowerCase().startsWith(query);
    });
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
}
