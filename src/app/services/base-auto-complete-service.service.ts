import { computed, inject, signal } from "@angular/core";
import { AutoCompleteCompleteEvent } from "primeng/autocomplete";
import { StorageService } from "./util";
import { Observable } from "rxjs";

export abstract class BaseAutoCompleteService<BASIC> {

  private _list = signal<BASIC[]>([]);
  protected list = computed<BASIC[]>(() => this._list());
  protected filteredList: BASIC[] = [];

  protected storageSV  = inject(StorageService);

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

  protected set _listItems(items: BASIC[]) {
    this._list.set(items);
  }

  protected addDisableItem(item: BASIC) {
    this._list().push(item);
  }
}
