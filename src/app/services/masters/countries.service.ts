import { Injectable, Signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { storageKeys } from '../../../environments/storage-keys';
import { Observable } from 'rxjs';
import { BasicCountry, Country, CountryRequest, ListsCountries } from '@interfaces/masters/locations/countries';
import { MessageResponse } from '@interfaces/message-response';
import { BaseService } from '@services/base-service.service';

const URL_SERVICES = environment.api_url + 'master/locations/countries';
const LIST_COUNTRIES_KEY = storageKeys.lists.list_countries;

@Injectable({
  providedIn: 'root'
})
export class CountriesService extends BaseService<Country, CountryRequest, Country, BasicCountry, ListsCountries>{

  constructor() {
    super(URL_SERVICES, LIST_COUNTRIES_KEY);
  }

  loadCountries(disableItem?: BasicCountry | BasicCountry[]) {
    this.loadList(true, this.getListBasicCountries.bind(this), disableItem);
  }

  get listCountries(): Signal<BasicCountry[]> {
    return this.list;
  }

  get filteredCountries(): BasicCountry[] {
    return this.filteredList;
  }

  override disable(id: string): Observable<MessageResponse<string>> {
    throw Error("This function cannot be used");
  }

  override enable(id: string): Observable<MessageResponse<string>> {
    throw Error("This function cannot be used");
  }

  private getListBasicCountries(lists: ListsCountries, addDisables: boolean): BasicCountry[] {
    let list = lists.enables;
    if (addDisables){
      list = [...lists.enables, ...lists.disables]
    }
    return list;
  }
}
