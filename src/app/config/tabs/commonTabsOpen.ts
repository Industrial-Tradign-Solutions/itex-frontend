import { computed, inject, NgZone, Signal, signal } from "@angular/core";
import { MessageResponse } from "@interfaces/message-response";
import { OpenCloseConfirmationModalComponent } from "@modals/util/open-close-confirmation-modal/open-close-confirmation-modal.component";
import { UtilService } from "@services/util";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { TabViewCloseEvent } from "primeng/tabview";
import { finalize, Observable, Subject, Subscription } from "rxjs";
import { environment } from "../../../environments/environment";
import { BasicPage } from "@config/page/basicPage";
import { EmitedTab, ItemTab, NameModules, TypeTab } from "@config/types/tabs";
import { Messages, TitlesMessages } from "@config/messages";
import { storageKeys } from "../../../environments";

const TIMEOUT = environment.timeout;
const TITLE_MESSAGES = TitlesMessages;
const MESSAGES = Messages.config.tabs;
const TABS_STORAGE_MODULE__ITEM_NAME = storageKeys.tabs.TABS_STORAGE_MODULE_ITEM_NAME;

export abstract class CommonTabs<ITEM extends ItemTab> extends BasicPage {

  //! Inyecciones
  protected dialogSV = inject(DialogService);
  protected utilSV   = inject(UtilService);
  //! -----------------------------

  protected _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());

  protected _tabs = signal<EmitedTab<ITEM>[]>([]);
  tabs = computed<EmitedTab<ITEM>[]>(() => this._tabs());

  modalOpenCloseRef!: Signal<DynamicDialogRef | undefined>;
  activeTab: number  = 0;

  private ngZone = inject(NgZone);
  private storageSubject = new Subject<string | null>();
  private storageSubscription!: Subscription;


  constructor(moduleName: NameModules) {
    super(true, moduleName);
    this.openItem();
  }

  protected dismissNavTab(onClose?: Observable<MessageResponse<string[]>>)  {
    this.destroyTab({onCloseItems:onClose, storageSubscription: this.storageSubscription});
  }

  private openItem() {
    window.addEventListener('storage', this.storageEventListener.bind(this));
    this.storageSubscription = this.storageSubject.asObservable().subscribe((newValue) => {
      if (newValue !== null && newValue !== '') {
        const item: EmitedTab<ITEM> = {
          type: 'edit',
          pristine: true,
          item: JSON.parse(JSON.stringify({
            id: newValue,
            name: 'Open Tab'
          }))
        }
        this.openTab(item);
        this.storageSV.delete(`${TABS_STORAGE_MODULE__ITEM_NAME}-${this.moduleName()}`);
      }
    });
  }

  private storageEventListener(event: StorageEvent) {
    if (event.key === `${TABS_STORAGE_MODULE__ITEM_NAME}-${this.moduleName()}`) {
      this.ngZone.run(() => {
        this.storageSubject.next(event.newValue);
      });
    }
  }

  protected openModalConfirmationOpenClose(list: ITEM[], onClose: Observable<MessageResponse<string[]>>) {
    this.modalOpenCloseRef =  computed(() => this.dialogSV.open(OpenCloseConfirmationModalComponent,{
      header: TITLE_MESSAGES.confirmation,
      width: '25rem',
      closable: false,
      closeOnEscape: false,
      data: {
        type: this.moduleName(),
        list
      }
    }));
    this.modalOpenCloseRef()?.onClose.subscribe((resp: {openOrClose: 'open' | 'close'}) => {
      if (resp && resp.openOrClose) {
        if (resp.openOrClose === 'close') {
          onClose
          .pipe(
            finalize(() => {
              setTimeout(() => {
                this._loading.set(false);
              }, TIMEOUT);
            })
          )
          .subscribe({
            next: message => {
              this.utilSV.setMessage(message.title, message.message, 'success');
            }
          });
        } else if (resp.openOrClose === 'open'){
          list.forEach(item => {
            this.openTab({type: 'edit', item, pristine: true});
          });
          this._loading.set(false);
        }
      }
      this.modalOpenCloseRef = computed(() => undefined);
    });
  }

  protected closeTabAction(event: TabViewCloseEvent | {index: number},  closeAndUnlock: Observable<MessageResponse<string>>){
    const index = event.index - 1;
    const tab: EmitedTab<ITEM> = this.tabs()[index];
    if(!tab.pristine){
      this.utilSV.confirm({
        message: MESSAGES.close_tab_action(tab.item.name),
        header: TITLE_MESSAGES.save_changes,
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Yes',
        rejectLabel: 'No',
        accept: () => {
          this.deleteTab(index, tab.type, closeAndUnlock);
        }
      });
    } else {
      this.deleteTab(index, tab.type, closeAndUnlock);
    }
  }

  private deleteTab(index: number, type: TypeTab, closeAndUnlock: Observable<MessageResponse<string>>) {
    (document.activeElement as HTMLElement)?.blur();


    this._tabs().splice(index, 1);
    this.activeTab = 0;
    if (type === 'edit' ) {
      closeAndUnlock.subscribe();
    }
  }

  openTab(obj: EmitedTab<ITEM>) {
    let index = 0;
    let index2 = this.tabs().findIndex(tab => {
      return tab.item.id === obj.item.id;
    });

    if(index2 === - 1){
      if (this.tabs().length >= environment.max_open_tabs ) {
        this.utilSV.setMessage(TITLE_MESSAGES.warning, MESSAGES.max_open_tabs(this.moduleName()), 'warn');
        return;
      } else {
        index = this._tabs().push(obj);
      }
    } else  {
      index = index2 + 1;
    }
    setTimeout(()=>this.activeTab = index, 50);
  }

}
