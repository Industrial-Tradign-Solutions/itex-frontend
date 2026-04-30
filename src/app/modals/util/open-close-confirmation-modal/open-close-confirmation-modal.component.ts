import { Component, computed, inject, signal } from '@angular/core';
import { NameModules } from '@config/types/tabs';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-open-close-client-prospects-modal',
  templateUrl: './open-close-confirmation-modal.component.html',
  styles: ''
})
export class OpenCloseConfirmationModalComponent {

  //! Inyecciones
  private config      = inject(DynamicDialogConfig);
  private ref         = inject(DynamicDialogRef);
  //! ----------------------------------------------

  //* Señales
  private _type = signal<NameModules>(this.config.data.type);
  type = computed<NameModules>(() => this._type());
  private _list = signal<{id: string, name: string}[]>(this.config.data.list);
  list = computed<{id: string, name: string}[]>(() => this._list());
  //*----------------------------------------------------------------


  openAll() {
    this.ref.close({openOrClose: 'open'})
  }

  closeAll() {
    this.ref.close({openOrClose: 'close'})
  }
}
