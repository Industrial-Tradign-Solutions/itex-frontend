import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BasicIpProduct } from '@interfaces/ip/products';
import { IpProductsService } from '@services/ip';
import { AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-substitute-ip-product-modal',
  templateUrl: './substitute-ip-product-modal.component.html',
  styleUrl: './substitute-ip-product-modal.component.scss'
})
export class SubstituteIpProductModalComponent {
  formSub!: FormGroup;

  private formBuilder = inject(FormBuilder);
  private ref         = inject(DynamicDialogRef);
  private ipProdSV    = inject(IpProductsService);

  constructor() {
    this.ipProdSV.loadBasicProducts();
    this.formSub = this.formBuilder.group({
      idPorduct: [
        null,
        [
          Validators.required
        ]
      ],
    });
  }

  closeModal() {
    this.ref.close();
  }

  onSubmit() {
    if (this.formSub.pristine) {
      this.ref.close();
      return;
    } else {
      this.ref.close({id: this.formSub.value.idPorduct});
    }
  }

  get filteredProducts(): BasicIpProduct[] {
    return this.ipProdSV.filteredIpProducts;
  }

  searchProduct(event: AutoCompleteCompleteEvent) {
    this.ipProdSV.searchAutoComplete(event);
  }
}
