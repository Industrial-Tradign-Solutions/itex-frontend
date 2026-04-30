import { Component, HostListener, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { BasicPage } from '../../../config/page/basicPage';
import { ClientsService, SuppliersService } from '@services/partners';
import { ClientDashboardType } from '../../../models/partners/clients/clientDashboard.type';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent extends BasicPage implements OnInit, OnDestroy{

  constructor() {
    super(false, 'Dashboard');
  }

  //! Inyecciones
  private clientsSV      = inject(ClientsService);
  private supplierSV     = inject(SuppliersService);
  //! ----------------------------------------------------------

  private _clientDashboard = signal<ClientDashboardType | undefined>(undefined);
  clientDashboard = computed<ClientDashboardType | undefined>(() => this._clientDashboard());

  private _supplierDashboard = signal<number>(0);
  supplierDashboard = computed<number>(() => this._supplierDashboard());


  ngOnInit(): void {
    this.clientsSV.dashboard().subscribe({
      next: resp => {
        this._clientDashboard.set(resp);
      }
    });
    this.supplierSV.dashboard().subscribe({
      next: resp => {
        this._supplierDashboard.set(resp);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyTab();
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification(event: any): void {
    this.destroyTab();
  }

  get colorScheme(): string {
    return this.layautSV.config.colorScheme;
  }

}
