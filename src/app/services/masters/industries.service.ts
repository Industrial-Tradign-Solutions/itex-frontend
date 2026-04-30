import { Injectable, Signal } from '@angular/core';
import { BasicIndustry, Industry, IndustryRequest, ListsIndustries } from '@interfaces/masters/industries';
import { environment } from '../../../environments/environment';
import { storageKeys } from '../../../environments';
import { BaseService } from '@services/base-service.service';

const URL_SERVICES = environment.api_url + 'master/industries';
const LIST_INDUSTRIES_KEY = storageKeys.lists.list_industries;

@Injectable({
  providedIn: 'root'
})
export class IndustriesService extends BaseService<Industry, IndustryRequest, Industry, BasicIndustry, ListsIndustries>{

  constructor() {
    super(URL_SERVICES, LIST_INDUSTRIES_KEY);
  }

  loadIndustries(addDisables: boolean, disableItem?: BasicIndustry | BasicIndustry[]): void {
    this.loadList(addDisables, this.getListBasicIndustries.bind(this), disableItem);
  }

  get listIndustries(): Signal<BasicIndustry[]> {
    return this.list;
  }

  get filteredIndustries(): BasicIndustry[] {
    return this.filteredList;
  }

  private getListBasicIndustries(lists: ListsIndustries, addDisables: boolean): BasicIndustry[] {
    let list = lists.enables;
    if (addDisables){
      list = [...lists.enables, ...lists.disables]
    }
    return list;
  }


}
