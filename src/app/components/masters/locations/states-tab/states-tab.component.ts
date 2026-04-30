import { Component, computed, inject, OnInit, Signal, signal } from '@angular/core';
import { moduleActionsId } from '../../../../../environments';
import { StatesService } from '@services/masters';
import { PermissionService } from '@services/security';
import { UtilService } from '@services/util';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { State } from '@interfaces/masters/locations/states';
import { Table } from 'primeng/table';
import { MessageResponse } from '@interfaces/message-response';
import { StateModalComponent } from '@modals/masters/locations/state-modal/state-modal.component';
import { environment } from '../../../../../environments/environment';


const STATES_ACTIONS_ID = moduleActionsId.masters.locations;
const TIMEOUT = environment.timeout;

@Component({
  selector: 'app-states-tab',
  templateUrl: './states-tab.component.html',
  styles: ['']
})
export class StatesTabComponent implements OnInit{

  //! Inyecciones
  private permissionsSV  = inject(PermissionService);
  private statesSV       = inject(StatesService);
  private utilSV         = inject(UtilService);
  private dialogSV       = inject(DialogService);
  //! ----------------------------------------------------------


  //* Señales
  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());

  private _listStates = signal<State[]>([]);
  listStates = computed<State[]>(() => this._listStates());

  private _statePermissions = signal({
    createState: false,
    updateState: false,
  });
  statePermissions = computed(() => this._statePermissions());


  modalStateRef!: Signal<DynamicDialogRef | undefined>;
  //* -----------------------------------------------------------

  ngOnInit() {
    this.loadStateActions();
    this.loadListStates();
  }

  openModalState(type: 'create' | 'edit', state?: State) {
    this.modalStateRef = computed( () => this.dialogSV.open(StateModalComponent,{
      header: `${(type === 'edit'? 'UPDATE' : 'CREATE')} STATE` ,
      width: '40rem',
      closable: false,
      closeOnEscape: false,
      data: {
        type,
        state
      }
    }));
    this.modalStateRef()?.onClose.subscribe((resp: {stateResponse: MessageResponse<State>}) => {
      if (resp && resp.stateResponse) {
        this.utilSV.setMessage(resp.stateResponse.title, resp.stateResponse.message, 'success');
        this.loadListStates();
      }
      this.modalStateRef = computed(() => undefined);
    });
  }



  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  loadListStates() {
    this._loading.set(true);
    setTimeout(() => {
      this.statesSV.listAll().subscribe({
        next: resp => {
          this._loading.set(false);
          this._listStates.set(resp);
        },
        error: err => {
          this.utilSV.setMessage('¡Error!', err, 'error');
          this._loading.set(false);
        }
      });
    }, TIMEOUT);
  }

  private async loadStateActions() {
    this._statePermissions.set({
      createState: await this.permissionsSV.isValidAction(STATES_ACTIONS_ID.CREATE_STATE),
      updateState: await this.permissionsSV.isValidAction(STATES_ACTIONS_ID.UPDATE_STATE)
    });
  }
}
