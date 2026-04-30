import { Component, computed, inject, signal } from '@angular/core';
import { BasicBrand } from '@interfaces/masters/brands';
import { BrandsService } from '@services/masters';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { environment } from '../../../../environments/environment';
import { Messages } from '@config/messages';
import { SuppliersService } from '@services/partners';
import { SupplierBasic } from '@interfaces/partners/suppliers';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { finalize, map, of, switchMap } from 'rxjs';

const TIMEOUT = environment.timeout;
const MESSAGES = Messages.pages.masters.brands;

@Component({
  selector: 'app-import-excel-brand-modal',
  templateUrl: './import-excel-brand-modal.component.html',
  styleUrl: './import-excel-brand-modal.component.scss'
})
export class ImportExcelBrandModalComponent {

  //! Inyecciones
  private ref         = inject(DynamicDialogRef);
  private brandSV     = inject(BrandsService);
  private supplierSV  = inject(SuppliersService);
  //! -----------------------------------------------

  //* Señales
  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());

  private _excelFile = signal<FormData | null>(null);
  excelFile = computed<FormData | null>(() => this._excelFile());

  private _brandResp = signal<BasicBrand[]>([]);
  brandResp = computed<BasicBrand[]>(() => this._brandResp());

  private _error = signal<string | null>(null);
  error = computed<string | null>(() => this._error());
  //*------------------------------------------------
  supplierId: string | undefined | null;

  constructor() {
    this._loading.set(true);
    this.supplierSV.loadAllBasic();
    setTimeout(() => {
      this._loading.set(false);
    }, TIMEOUT);
  }

  selectFile(fileEvent:any ) {
    const file = fileEvent.files[0];
    if(file) {
      const formData = new FormData();
      formData.append('file', file, file.name);
      this._excelFile.set(formData);
    }
  }

  removeFile() {
    this._excelFile.set(null);
    this._brandResp.set([]);
  }

  closeModal() {
    this.ref.close();
  }

  importBrand() {
    this._brandResp.set([]);
    this._loading.set(true);
    this._error.set(null);
    setTimeout(() => {
      this.brandSV.validateBrandFile(this.excelFile()!).subscribe({
        next: resp => {
          if (resp && resp.length > 0) {
            this._brandResp.set(resp);
          } else {
            this._error.set(MESSAGES.importFile);
            this.removeFile();
          }
          this._loading.set(false);
        },
        error: err => {
          this._error.set(err);
          this.removeFile();
          this._loading.set(false);
        }
      });
    }, TIMEOUT);
  }

  saveBrands() {
    this._loading.set(true);
    this.brandSV.importListBrands(this.brandResp()).pipe(
      switchMap(resp => {
        if (this.supplierId) {
          return this.brandSV.assignSupplierListBrands(resp.data, this.supplierId).pipe(
            map(respAssign => ({ importBrandResponse: respAssign }))
          );
        } else {
          return of({ importBrandResponse: resp });
        }
      }),
      finalize(() => this._loading.set(false))
    ).subscribe({
      next: result => {
        this.ref.close(result);
      },
      error: err => {
        this._error.set(err);
      }
    });
  }


  get filteredSuppliers(): SupplierBasic[] {
    return this.supplierSV.filteredList;
  }

  searchSupplier(event: AutoCompleteCompleteEvent) {
    this.supplierSV.searchAutoComplete(event);
  }

  changeFile() {
    this._loading.set(true);
    setTimeout(() => {
      this._brandResp.set([]);
      this._excelFile.set(null);
      this._loading.set(false);
    }, TIMEOUT);
  }
}
