import { Component, computed, HostListener, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { BasicPage } from '@config/page/basicPage';
import { PermissionService } from '@services/security';

@Component({
  selector: 'app-docs',
  templateUrl: './docs.component.html',
  styleUrl: './docs.component.scss'
})
export class DocsComponent extends BasicPage implements OnInit, OnDestroy {

  private permissionSV = inject(PermissionService);


  private _listMenus = signal<any[]>([]);
  listMenus = computed<any[]>(() => this._listMenus());



  constructor() {
    super(false, 'Docs');
  }


  ngOnInit(): void {
    this.permissionSV.listMenuItems().then(resp => {
      this._listMenus.set(resp);
    });
  }

  ngOnDestroy(): void {
    this.destroyTab();
  }

  openDocs(url: string) {
    if(!url) return;
    window.open(url, '_blank');
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification(event: any): void {
    this.destroyTab();
  }

}
