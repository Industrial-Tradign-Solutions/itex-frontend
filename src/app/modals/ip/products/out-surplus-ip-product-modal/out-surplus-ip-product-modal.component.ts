import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-out-surplus-ip-product-modal',
  templateUrl: './out-surplus-ip-product-modal.component.html',
  styleUrl: './out-surplus-ip-product-modal.component.scss'
})
export class OutSurplusIpProductModalComponent {
  formOut!: FormGroup;

  private formBuilder = inject(FormBuilder);
  private ref         = inject(DynamicDialogRef);

  constructor() {
    this.formOut = this.formBuilder.group({
      quantity: [
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
    if (this.formOut.pristine) {
      this.ref.close();
      return;
    } else {
      this.ref.close(this.formOut.value);
    }
  }
}
