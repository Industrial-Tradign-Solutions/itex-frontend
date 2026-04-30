import { computed, Directive, EventEmitter, inject, Input, Output, signal, Signal, ViewChild } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { EmitedTab, ItemTab } from "@config/types/tabs";
import { Page } from "@interfaces/page.model";
import { StaticListsService, UtilService } from "@services/util";
import { Paginator } from "primeng/paginator";
import { Table } from "primeng/table";
import { environment } from "../../../environments/environment";
import { SortEvent } from "primeng/api";
import { finalize, Observable } from "rxjs";

const TIMEOUT = environment.timeout;

@Directive()
export abstract class CommonListTab<ITEM extends ItemTab, P> {
  @Output() opened = new EventEmitter<EmitedTab<ITEM>>();
  @Input({required: true}) permissions!: Signal<P>;
  @ViewChild('paginator') paginator!: Paginator;
  @ViewChild('dt1') dt!: Table;

  //! Inyecciones
  protected formBuilder   = inject(FormBuilder);
  protected utilSV        = inject(UtilService);
  protected staticListSV  = inject(StaticListsService);
  //! ----------------------------------------------------------
  //* Señales
  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());
  protected _page = signal<Page<ITEM>>({
    content: [],
    page: {
      number: 0,
      size: 10,
      totalElements: 0,
      totalPages: 0
    }
  });
  page = computed<Page<ITEM>>(() => this._page());
  //* -----------------------------------------------------------

  //? Variables
  formFilter!: FormGroup;
  disableShort: boolean = false;
  //?------------------------------------------------------------

  open(emited: EmitedTab<ITEM>) {
    this.opened.emit(emited);
  }

  resetForm(dt: Table) {
    this.formFilter.reset();
    dt.reset();
  }

  protected new(item: ITEM) {
    this.open({
      type: 'create',
      item,
      pristine: true
    });
  }

  protected searchBy(event: KeyboardEvent, oldKeyAutoComplete: string, searchFn: (resetPaginator: boolean, page?: number, size?: number) => void) {
    if (event.key === 'Enter' && oldKeyAutoComplete === 'Enter') {
      searchFn(true);
      event.preventDefault();
    } else {
      oldKeyAutoComplete = event.key;
    }
  }

  protected sort(event: SortEvent, searchFn: (resetPaginator: boolean, page?: number, size?: number) => void) {
    if (!this.disableShort && this.page().content.length > 0) {
      this.formFilter.controls['shortBy'].setValue(event.field);
      this.formFilter.controls['shortOrder'].setValue(event.order);
      searchFn(true);
    }
  }

  protected searchAction(obs: Observable<Page<ITEM>>) {
    this.viewLoading();
    obs.pipe(
      finalize(() => this.closeLoading())
    ).subscribe({
      next: resp => {
        this._page.set(resp);
      },
      error: err => {
        this.utilSV.setMessage('¡Error!', err, 'error');
      }
    });
  }

  protected viewLoading() {
    this._loading.set(true);
    this.formFilter?.disable();
  }

  protected closeLoading() {
    setTimeout(() => {
      this._loading.set(false);
      this.formFilter?.enable();
      setTimeout(() => {
        this.disableShort = false;
      }, 100);
    }, TIMEOUT );
  }
  protected setLoading(value: boolean) {
    this._loading.set(value);
  }
}
