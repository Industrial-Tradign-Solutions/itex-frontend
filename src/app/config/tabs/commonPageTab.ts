import { computed, Directive, EventEmitter, inject, Input, Output, signal, Signal } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { EmitedTab, ItemTab } from "@config/types/tabs";
import { StaticListsService, UtilService } from "@services/util";
import { DialogService } from "primeng/dynamicdialog";
import { finalize, Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { BasicUser } from "@interfaces/administration/user";
import { MessageResponse } from "@interfaces/message-response";
import { Modules } from "@config/types/tabs/modulesNames.type";

const TIMEOUT = environment.timeout;

@Directive()
export abstract class CommonPageTab<LIST_ITEM extends ItemTab, PERMISSIONS, ITEM extends {id: string; name: string, openBy: BasicUser}> {
  //? Outputs
  @Output() onClose = new EventEmitter<{index: number}>();
  //?------------------------------------------------------------------
  //*Inputs
  @Input() permissions!: Signal<PERMISSIONS>;
  @Input({required: true}) tabItem!: EmitedTab<LIST_ITEM>;
  @Input({required: true}) index!: number;
  //*------------------------------------------------------------------
  //! Inyecciones
  protected utilSV         = inject(UtilService);
  protected formBuilder    = inject(FormBuilder);
  protected staticListSV   = inject(StaticListsService);
  protected dialogSV       = inject(DialogService);
  //! _________________________________________________________________
  //* Señales
  protected _item = signal<ITEM | undefined>(undefined);
  item = computed<ITEM | undefined>(() => this._item());
  protected _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());
  protected _loadingDownload = signal<boolean>(false);
  loadingDownload = computed<boolean>(() => this._loadingDownload());
  protected _loadingPrintAndSent = signal<boolean>(false);
  loadingPrintAndSent = computed<boolean>(() => this._loadingPrintAndSent());
  protected _isValidOpen = signal<boolean>(true);
  isValidOpen = computed<boolean>(() => this._isValidOpen());
  //*___________________________________________________________________
  //? Variables
  formTab!: FormGroup;
  errors: string[] = [];
  showForm = false;
  animation = 'fadeIn';
  private MESSAGES: any;
  //?------------------------------------------------------------

  constructor(messages: any) {
    this.MESSAGES = messages
  }

  protected onInitAction(config: {
    updatePermission: boolean;
    openAndLock: Observable<{data: ITEM, isValidOpen: boolean}>;
    module: Modules ;
  }): void {
    this._loading.set(true);
    if (this.tabItem.type !== 'create') {
      if (!config.updatePermission) {
        this.tabItem.type = 'view';
      }
      config.openAndLock.subscribe({
        next: resp => {
          setTimeout(() => {
            if (!resp.isValidOpen) {
              this.tabItem.type = 'view';
              this.utilSV.confirm({
                message: this.MESSAGES.openBy(config.module, resp.data.name, resp.data.openBy.fullName),
                acceptLabel: 'Ok',
                rejectVisible: false
              });
            }
            this._item.set(resp.data);
            this._isValidOpen.set(resp.isValidOpen);
            this.tabItem.item.name = resp.data.name;
            this.buildForm();
            this._loading.set(false);
          }, TIMEOUT);
        }, error: err => {
          this.utilSV.setMessage('Warning', err, 'warn')
          this.onClose.emit({index: this.index + 1});
          this._loading.set(false);
        }
      });
    } else {
      setTimeout(() => {
        this.buildForm();
        this._loading.set(false);
      }, TIMEOUT);
    }
  }

  protected downloadFile(file: Observable<Blob>, name: string): void {
    this._loadingDownload.set(true);
    file
    .pipe(
      finalize( () => {
        setTimeout(() => {
          this._loadingDownload.set(false);
        }, TIMEOUT);
      })
    )
    .subscribe({
      next: (pdfBlob) => {
        const blob = new Blob([pdfBlob], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);

        // Crear un link temporal y descargar
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}.pdf`;
        a.click();

        // Limpieza
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.utilSV.setMessage('Error', 'Error printing the document', 'error');
      }
    });
  }

  protected onSubmitAction(config: {
    updatePermission: boolean;
    action: Observable<MessageResponse<ITEM>>;
  }) {
    this.animation = 'fadeOut';
    this.errors = [];
    this._loading.set(true);
    this.formTab.disable();
    setTimeout(() => {
      config.action
      .pipe(
        finalize(() => {
          setTimeout(() => {
            this._loading.set(false);
            this.enableForm();
            this.animation = 'fadeIn';
          }, TIMEOUT);
        })
      )
      .subscribe({
        next: resp => {
          this.showForm = false;
          setTimeout(() => {
            this.utilSV.setMessage(resp.title, resp.message, 'success');
            this._item.update(() => resp.data);
            this.tabItem.item.name = resp.data.name;
            this.tabItem.item.id = resp.data.id;

            if (this.tabItem.type === 'create') {
              if (config.updatePermission) {
                this.tabItem.type = 'edit';
              } else {
                this.tabItem.type = 'view';
              }
            }

            this.buildForm();
          }, TIMEOUT);
        }, error: err => {
          if (err.formErrors) {
            for (const key in err.formErrors) {
              if (err.formErrors.hasOwnProperty(key)) {
                this.utilSV.setMessage('Error!', err.formErrors[key], 'error');
              }
            }
          } else {
            this.utilSV.setMessage('Error!', err.errorMessage, 'error');
          }
        }
      });
    }, TIMEOUT / 1.5);
  }

  private buildForm() {
    this.buildFormAction();
    this.tabItem.pristine = true;
    if (this.tabItem.type !== 'view') {
      const sub = this.formTab.valueChanges.subscribe({
        next: () => {
          if (!this.tabItem.pristine) {
            sub.unsubscribe();
          } else {
            this.tabItem.pristine = this.formTab.pristine;
          }
        }
      });
    }
    this.enableForm();
  }

  protected getCurrency() {
    const currency = this.formTab.get('currency')?.value;
    return currency ? currency : 'USD';
  }

  clone<T>(item: T): T {
    return JSON.parse(JSON.stringify(item)) as T;
  }

  protected abstract getRequest(): any;
  protected abstract buildFormAction(): void;
  protected abstract enableForm(): void;
  abstract onSubmit(): void;
}
