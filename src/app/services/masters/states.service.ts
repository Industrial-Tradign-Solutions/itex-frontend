import { Injectable, Signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { storageKeys } from '../../../environments';
import { Observable } from 'rxjs';
import { MessageResponse } from '@interfaces/message-response';
import { BasicState, ListsStates, State, StateRequest } from '@interfaces/masters/locations/states';
import { BaseService } from '@services/base-service.service';

const URL_SERVICES = environment.api_url + 'master/locations/states';
const LIST_STATES_KEY = storageKeys.lists.list_states;

@Injectable({
  providedIn: 'root'
})
export class StatesService extends BaseService<State, StateRequest, State, BasicState, ListsStates>{

  constructor() {
    super(URL_SERVICES, LIST_STATES_KEY);
  }

  loadStates(disableItem?: BasicState | BasicState[]) {
    this.loadList(true, this.getListBasicStates.bind(this), disableItem);
  }

  get listStates(): Signal<BasicState[]> {
    return this.list;
  }

  get filteredStates(): BasicState[] {
    return this.filteredList;
  }

  override disable(id: string): Observable<MessageResponse<string>> {
    throw Error("This function cannot be used");
  }

  override enable(id: string): Observable<MessageResponse<string>> {
    throw Error("This function cannot be used");
  }

  private getListBasicStates(lists: ListsStates, addDisables: boolean): BasicState[] {
    let list = lists.enables;
    if (addDisables){
      list = [...lists.enables, ...lists.disables]
    }
    return list;
  }
}
