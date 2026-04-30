import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-add-surplus-ip-product-modal',
  templateUrl: './add-surplus-ip-product-modal.component.html',
  styleUrl: './add-surplus-ip-product-modal.component.scss'
})
export class AddSurplusIpProductModalComponent {

  formAdd!: FormGroup;

  private formBuilder = inject(FormBuilder);
  private ref         = inject(DynamicDialogRef);

  constructor() {
    this.formAdd = this.formBuilder.group({
      location: [
        null,
        [
          Validators.required
        ]
      ],
      price: [
        null,
        [
          Validators.required
        ]
      ],
      quantity: [
        null,
        [
          Validators.required
        ]
      ],
      whNumber: [
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
    if (this.formAdd.pristine) {
      this.ref.close();
      return;
    } else {
      this.ref.close(this.formAdd.value);
    }
  }
}
