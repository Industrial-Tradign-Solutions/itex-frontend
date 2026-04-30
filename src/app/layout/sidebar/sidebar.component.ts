import { Component, ElementRef, ViewChild } from '@angular/core';
import { LayoutService } from '../layout.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styles: []
})
export class SidebarComponent {

  @ViewChild('menuContainer') menuContainer!: ElementRef;

  constructor(
    public layoutService: LayoutService, 
    public el: ElementRef
  ) {}
}
