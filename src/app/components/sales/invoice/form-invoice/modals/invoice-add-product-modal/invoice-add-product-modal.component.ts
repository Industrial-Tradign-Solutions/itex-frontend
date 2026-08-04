import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { BasicIpProduct } from '@interfaces/ip/products';
import { InvoiceProductBulkRequest } from '@interfaces/sales/invoice';
import { IpProductsService } from '@services/ip';
import { AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

/**
 * Add-product picker for the invoice. Intentionally simpler than Quotations'
 * equivalent (which builds bulk selections from a Quote Request): the invoice
 * has no such source yet, so this only lets the user search one `t_ip_products`
 * record and fill the line manually.
 */
@Component({
  selector: 'app-invoice-add-product-modal',
  templateUrl: './invoice-add-product-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InvoiceAddProductModalComponent {

  private formBuilder = inject(FormBuilder);
  private productSV   = inject(IpProductsService);
  private ref         = inject(DynamicDialogRef);

  form = this.formBuilder.group({
    productId: [null as string | null, [Validators.required]],
    quantity: [1, [Validators.required, Validators.min(0.00001)]],
    unitType: ['UNITS', [Validators.required]],
    leadTime: [0, [Validators.required, Validators.min(0)]],
    leadTimeType: ['DAYS', [Validators.required]],
    unitPrice: [0, [Validators.required, Validators.min(0)]],
    profitMargin: [0, [Validators.required, Validators.min(0)]],
    condition: ['NEW', [Validators.required]]
  });

  constructor() {
    this.productSV.loadBasicProducts();
  }

  get filteredProducts(): BasicIpProduct[] {
    return this.productSV.filteredIpProducts;
  }

  searchProduct(event: AutoCompleteCompleteEvent): void {
    this.productSV.searchAutoComplete(event);
  }

  selectProduct(event: AutoCompleteSelectEvent): void {
    this.form.patchValue({ productId: (event.value as BasicIpProduct).id });
  }

  save(): void {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const request: InvoiceProductBulkRequest = [{
      productId: raw.productId!,
      quantity: raw.quantity!,
      unitType: raw.unitType!,
      leadTime: raw.leadTime!,
      leadTimeType: raw.leadTimeType!,
      unitPrice: raw.unitPrice!,
      profitMargin: raw.profitMargin!,
      condition: raw.condition!
    }];

    this.ref.close(request);
  }

  cancel(): void {
    this.ref.close();
  }

}
