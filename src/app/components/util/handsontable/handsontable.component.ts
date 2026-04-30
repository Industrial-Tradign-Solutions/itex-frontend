import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, NON_COMMERCIAL_LICENSE } from "@handsontable/angular-wrapper";
import { StorageService, UtilService } from '@services/util';
import { CopyPaste, registerPlugin, AutoColumnSize, ContextMenu, ManualColumnResize } from 'handsontable/plugins';
import { storageKeys } from '../../../../environments';

registerPlugin(AutoColumnSize);
registerPlugin(CopyPaste);
registerPlugin(ContextMenu);
registerPlugin(ManualColumnResize);

const DARK_MODE_KEY = storageKeys.dark_mode;

@Component({
  selector: 'app-handsontable',
  template: `
    <div class="p-fluid w-full animate__animated animate__fadeIn">
      <div class="formgrid grid mt-1">
        <div class="field col-12 md:col-1" >
          <button pButton
            (click)="clearData()"
            label="Clear"
            icon="pi pi-eraser"
            severity="danger"
            type="button">
          </button>
        </div>
        <div class="field col-12 md:col-1" style="text-align: end !important;">
          <button pButton
            (click)="validateDataAction()"
            label="Validate Data"
            icon="pi pi-cloud-upload"
            severity="success"
            type="button">
          </button>
        </div>
      </div>
      <p-scrollPanel [style]="{ width: '100%', height: scrollHeight }">
        @if (headers) {
          <hot-table  [data]="data" [settings]="gridSettings" />
        }
        @if (requiredList && requiredList.length > 0) {
          <ul style="color: red;">
              @for(required of requiredList; track required) {
                <li>{{required}}</li>
              }
          </ul>
        }
      </p-scrollPanel>
    </div>
  `
})
export class HandsontableComponent implements OnChanges, OnInit{

  @ViewChild(HotTableComponent, { static: false })
  hotTable!: HotTableComponent;

  @Input({alias: 'headers', required: true}) headers!: string[];
  @Input({alias: 'example', required: false}) example?: string[];
  @Input({alias: 'otherData', required: false}) otherData?: string[][];

  @Input({alias: 'requiredList', required: false}) requiredList?: string[];
  @Input({alias: 'scrollHeight', required: true}) scrollHeight!: string;

  @Output() validateData = new EventEmitter<any[]>();

  private utilSV    = inject(UtilService);
  private storageSV = inject(StorageService)

  data: string[][] = [];

  gridSettings: GridSettings = {
    licenseKey: NON_COMMERCIAL_LICENSE,
    layoutDirection: "ltr",
    themeName: "ht-theme-horizon",
    rowHeaders: true,
    manualColumnResize: true,
    copyPaste: true,
    autoColumnSize: true,
    contextMenu: [
      'remove_row',
      'row_above',
      'row_below'
    ],
    height: 'auto',
    autoWrapRow: true,
    autoWrapCol: true
  }

  ngOnInit(): void {
    this.storageSV.get(DARK_MODE_KEY).then( (resp: boolean) => {
      this.hotTable.hotInstance?.updateSettings({
        themeName: resp ? 'ht-theme-horizon-dark' : 'ht-theme-horizon'
      });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['headers'] && this.headers.length > 0) {
      this.gridSettings = {
        ...this.gridSettings,
        colHeaders: this.headers,
        maxCols: this.headers.length
      };
      if (this.otherData && this.otherData.length > 0) {
        this.data = this.otherData;
      } else {
        this.clearData(false);
      }
    }
  }

  private getHeaders(): string[] {
    return this.utilSV.clone<string[]>(this.headers).map(header =>
      header
      .replace('-', '')
      .replace('#', 'Number')
      .toLowerCase()
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
        index === 0 ? word.toLowerCase() : word.toUpperCase()
      )
      .replace(/\s+/g, '')
    );
  }

  private convertToObjects(): any[] {
    const camelHeaders = this.getHeaders();
    return this.data.map(row => {
      const obj: any = {};
      camelHeaders.forEach((key, i) => {
        obj[key] = row[i] ?? '';
      });
      return obj;
    });
  }

  validateDataAction() {
    this.validateData.emit(this.convertToObjects());
  }

  clearData(deleteExample: boolean = true) {
    this.data = [];
    if (deleteExample) {
      this.data.push(this.utilSV.clone<string[]>(this.headers).map(() => ''));
    } else {
      this.data.push(this.utilSV.clone<string[]>(this.example!));
    }
  }
}
