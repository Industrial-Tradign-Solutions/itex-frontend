import { Injectable, Signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { BasicCity, City, CityRequest, ListsCities } from '@interfaces/masters/locations/cities';
import { Observable } from 'rxjs';
import { MessageResponse } from '@interfaces/message-response';
import { BaseService } from '@services/base-service.service';

const URL_SERVICES = environment.api_url + 'master/locations/cities';

@Injectable({
  providedIn: 'root'
})
export class CityService extends BaseService<City, CityRequest, City, BasicCity, ListsCities>{

  constructor() {
    super(URL_SERVICES);
  }

  loadCities(disableItem?: BasicCity | BasicCity[]): Observable<BasicCity[]> {
    return this.loadList(true, this.getListBasicCities.bind(this), disableItem);
  }

  get listCities(): Signal<BasicCity[]> {
    return this.list;
  }

  get filteredCities(): BasicCity[] {
    return this.filteredList;
  }

  override disable(id: string): Observable<MessageResponse<string>> {
    throw Error("This function cannot be used");
  }

  override enable(id: string): Observable<MessageResponse<string>> {
    throw Error("This function cannot be used");
  }

  private getListBasicCities(lists: ListsCities, addDisables: boolean): BasicCity[] {
    let list = lists.enables;
    if (addDisables){
      list = [...lists.enables, ...lists.disables]
    }
    return list;
  }

}
