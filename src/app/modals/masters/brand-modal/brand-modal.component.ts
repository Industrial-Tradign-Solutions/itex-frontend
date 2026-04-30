import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BasicBrand, Brand, BrandRequest } from '@interfaces/masters/brands';
import { BrandsService } from '@services/masters';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { environment } from '../../../../environments/environment';
import { SuppliersService } from '@services/partners';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { SupplierBasic } from '@interfaces/partners/suppliers';
import { catchError, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { MessageResponse } from '@interfaces/message-response';

const TIMEOUT = environment.timeout;

@Component({
  selector: 'app-brand-modal',
  templateUrl: './brand-modal.component.html',
  styleUrl: './brand-modal.component.scss'
})
export class BrandModalComponent {
  //! Inyecciones
  private ref         = inject(DynamicDialogRef);
  private brandSV     = inject(BrandsService)
  private formBuilder = inject(FormBuilder);
  private supplierSV  = inject(SuppliersService);
  //! -----------------------------------------------

  //* Señales
  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());

  private _error = signal<string | null>(null);
  error = computed<string | null>(() => this._error());
  //*------------------------------------------------

  formBrand!: FormGroup;

  constructor() {
    this.supplierSV.loadAllBasic();
    setTimeout(() => {
      this.buildForm();
    }, TIMEOUT);
  }

  closeModal() {
    this.ref.close();
  }

  validateAndSaveBrand(): void {
    if (this.formBrand.pristine) {
      this.ref.close();
      return;
    }
    this.disableForm();
    const data: BrandRequest = this.formBrand.value;
    this.brandSV.validateBrand(data.name).pipe(
      switchMap(resp => {
        if (resp.id === null) {
          // Marca no existe: crear y posiblemente asignar
          return this.brandSV.create(data).pipe(
            switchMap(createdBrand => {
              const brandId = createdBrand.data.id;
              if (data.supplierId !== null) {
                return this.assignAndReturn(brandId, data.supplierId, createdBrand);
              }
              return of(createdBrand);
            })
          );
        } else {
          // Marca ya existe
          if (data.supplierId !== null) {
            return this.assignAndReturn(resp.id, data.supplierId);
          } else {
            return throwError(() => `The Brand entered is already registered (${resp.name})`);
          }
        }
      }),
      tap(brandData => this.closeFormData(brandData)),
      catchError(err => {
        this._error.set(err);
        this.enableForm();
        return of(null);
      })
    ).subscribe();
  }

  private assignAndReturn(brandId: string, supplierId: string, brandData?: MessageResponse<Brand>): Observable<any> {
    return this.brandSV.assignBrandSupplier({ brandId, supplierId }).pipe(
      map(resp => brandData ?? resp)
    );
  }

  private closeFormData(brand: Brand | BasicBrand) {
    setTimeout(() => {
      this.ref.close({brandResponse: brand});
    }, TIMEOUT);
  }

  get filteredSuppliers(): SupplierBasic[] {
    return this.supplierSV.filteredList;
  }

  searchSupplier(event: AutoCompleteCompleteEvent) {
    this.supplierSV.searchAutoComplete(event);
  }

  private disableForm() {
    this._loading.set(true);
    this._error.set(null);
    this.formBrand.disable();
  }

  private enableForm() {
    setTimeout(() => {
      this._loading.set(false);
      this.formBrand.enable();
    }, TIMEOUT);
  }

  private buildForm() {
    this.formBrand = this.formBuilder.group({
      name: [
        null,
        [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(1000)
        ]
      ],
      supplierId: [
        null,
        []
      ]
    });
  }
}
