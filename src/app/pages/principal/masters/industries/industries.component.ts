import { Component, computed, HostListener, inject, OnDestroy, OnInit, Signal, signal } from '@angular/core';
import { Industry } from '@interfaces/masters/industries';
import { IndustriesService } from '@services/masters';
import { PermissionService } from '@services/security';
import { UtilService } from '@services/util';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { moduleActionsId } from '../../../../../environments';
import { MessageResponse } from '@interfaces/message-response';
import { Observable } from 'rxjs';
import { Table } from 'primeng/table';
import { IndustriesModalComponent } from '@modals/masters/industries-modal/industries-modal.component';
import { environment } from '../../../../../environments/environment';
import { BasicPage } from '../../../../config/page/basicPage';
import { Messages } from '@config/messages';

const INDUSTRIES_ACTIONS_ID = moduleActionsId.masters.industries;
const TIMEOUT = environment.timeout;
const MESSAGES = Messages.pages.masters.industries;

@Component({
  selector: 'app-industries',
  templateUrl: './industries.component.html',
  styles: ['']
})
export class IndustriesComponent extends BasicPage implements OnInit, OnDestroy{
  constructor() {
    super(true, 'Industries');
  }

  //! Inyecciones
  private permissionsSV  = inject(PermissionService);
  private industriesSV   = inject(IndustriesService);
  private utilSV         = inject(UtilService);
  private dialogSV       = inject(DialogService);
  //! ----------------------------------------------------------

  //* Señales
  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());

  private _listIndustries = signal<Industry[]>([]);
  listIndustries = computed<Industry[]>(() => this._listIndustries());

  private _industriesPermissions = signal({
    createIndustry: false,
    updateIndustry: false,
    enableIndustry: false,
    disableIndustry: false
  });
  industriesPermissions = computed(() => this._industriesPermissions());

  modalIndustryRef!: Signal<DynamicDialogRef | undefined>;
  //* -----------------------------------------------------------

  ngOnInit(): void {
    this.loadIndustriesActions();
    this.loadListIndustries();
  }

  ngOnDestroy(): void {
    this.destroyTab();
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification(event: any): void {
    this.destroyTab();
  }

  loadListIndustries() {
    this._loading.set(true);
    setTimeout(() => {
      this.industriesSV.listAll().subscribe({
        next: resp => {
          this._loading.set(false);
          this._listIndustries.set(resp);
        },
        error: err => {
          this.utilSV.setMessage('¡Error!', err, 'error');
          this._loading.set(false);
        }
      });
    }, TIMEOUT);
  }

  openModalIndustry(type: 'create' | 'edit', industry?: Industry) {
    this.modalIndustryRef =  computed(() => this.dialogSV.open(IndustriesModalComponent,{
      header: `${(type === 'edit'? 'UPDATE' : 'CREATE')} INDUSTRY` ,
      width: '40rem',
      closable: false,
      closeOnEscape: false,
      data: {
        type,
        industry
      }
    }));
    this.modalIndustryRef()?.onClose.subscribe((resp: {industryResponse: MessageResponse<Industry>}) => {
      if (resp && resp.industryResponse) {
        this.utilSV.setMessage(resp.industryResponse.title, resp.industryResponse.message, 'success');
        this.loadListIndustries();
      }
      this.modalIndustryRef = computed(() => undefined);
    });
  }

  disableIndustry(industry: Industry) {
    if (!this.industriesPermissions().disableIndustry) return;
    this.utilSV.confirm({
      message: MESSAGES.disable(industry.name),
      accept: () => {
        this.serviceAction(this.industriesSV.disable(industry.id));
      }
    });
  }

  enableIndustry(industry: Industry) {
    if (!this.industriesPermissions().enableIndustry) return;
    this.utilSV.confirm({
      message: MESSAGES.enable(industry.name),
      accept: () => {
        this.serviceAction(this.industriesSV.enable(industry.id));
      }
    });
  }

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  private serviceAction(observable: Observable<MessageResponse<string>>) {
    this._loading.set(true);
    setTimeout(() => {
      observable.subscribe({
        next: resp => {
          this.utilSV.setMessage(resp.title, resp.message, 'success');
          this.loadListIndustries();
        },
        error: err => {
          this.utilSV.setMessage('¡Error!', err, 'error');
          this._loading.set(false);
        }
      });
    }, TIMEOUT);
  }

  private async loadIndustriesActions() {
    this._industriesPermissions.set({
      createIndustry: await this.permissionsSV.isValidAction(INDUSTRIES_ACTIONS_ID.CREATE_INDUSTRY),
      updateIndustry: await this.permissionsSV.isValidAction(INDUSTRIES_ACTIONS_ID.UPDATE_INDUSTRY),
      enableIndustry: await this.permissionsSV.isValidAction(INDUSTRIES_ACTIONS_ID.ENABLE_INDUSTRY),
      disableIndustry: await this.permissionsSV.isValidAction(INDUSTRIES_ACTIONS_ID.DISABLE_INDUSTRY)
    });

  }

}
