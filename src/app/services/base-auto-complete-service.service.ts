import { computed, inject, signal } from "@angular/core";
import { AutoCompleteCompleteEvent } from "primeng/autocomplete";

export abstract class BaseAutoCompleteService<BASIC> {

  private _list = signal<BASIC[]>([]);
  protected list = computed<BASIC[]>(() => this._list());
  protected filteredList: BASIC[] = [];

  searchAutoComplete(event: AutoCompleteCompleteEvent) {
    const query = (event.query ?? '').toLowerCase();
    this.filteredList = this.list().filter(item => {
      const name = (item as Record<string, unknown>)['name'];
      return typeof name === 'string' && name.toLowerCase().startsWith(query);
    });
  }

  protected set _listItems(items: BASIC[]) {
    this._list.set(items);
  }

  protected addDisableItem(item: BASIC) {
    this._list.update(list => [...list, item]);
  }
}
