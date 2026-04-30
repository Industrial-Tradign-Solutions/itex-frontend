import { Component, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { LayoutService } from '@layout/layout.service';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styles: ``
})
export class NotFoundComponent{
  private layautSV = inject(LayoutService);
  constructor() {
    inject(Title).setTitle(`ITEX - Not Found`);
    this.layautSV.state.staticMenuDesktopInactive = false;
  }
}
