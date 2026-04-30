import { Component, OnInit } from '@angular/core';
import { LayoutService } from '../layout.service';
import { PermissionService } from '../../services/security/permission.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styles: []
})
export class MenuComponent implements OnInit{
  model: any[] = [];

  constructor(
    public layoutService: LayoutService,
    private permissionSV: PermissionService
  ) { }

  async ngOnInit() {
    this.model = [
      {
        label: '',
        icon: 'pi pi-home',
        items: [
          {
            label: 'Dashboard',
            icon: 'pi pi-desktop',
            routerLink: ['/p/dashboard']
          },
        ],
      },
      ...await this.permissionSV.listMenuItems(),
      {
        label: '',
        icon: 'pi pi-book',
        items: [
          {
            label: 'Docs',
            icon: 'pi pi-book',
            routerLink: ['/p/docs']
          },
        ],
      },
    ];
  }
}
