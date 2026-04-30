import { Component, HostListener, OnDestroy } from '@angular/core';
import { BasicPage } from '@config/page/basicPage';

@Component({
  selector: 'app-locations',
  templateUrl: './locations.component.html',
  styleUrls: ['./locations.component.scss']
})
export class LocationsComponent extends BasicPage implements OnDestroy {
  constructor() {
    super(true, 'Locations');
  }

  ngOnDestroy(): void {
    this.destroyTab();
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification(event: any): void {
    this.destroyTab();
  }
}
