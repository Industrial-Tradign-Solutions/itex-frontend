import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormIpProductsComponent } from './form-ip-products.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProgressBarModule } from 'primeng/progressbar';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { ChipModule } from 'primeng/chip';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { CheckboxModule } from 'primeng/checkbox';
import { SubstituteIpProductModalModule } from '@modals/ip/products/substitute-ip-product-modal/substitute-ip-product-modal.module';
import { HistoryIpProductModalModule } from '@modals/ip/products/history-ip-product-modal/history-ip-product-modal.module';
import { FieldsetModule } from 'primeng/fieldset';
import { OutSurplusIpProductModalModule } from '@modals/ip/products/out-surplus-ip-product-modal/out-surplus-ip-product-modal.module';
import { AddSurplusIpProductModalModule } from '@modals/ip/products/add-surplus-ip-product-modal/add-surplus-ip-product-modal.module';


@NgModule({
  declarations: [
    FormIpProductsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ProgressBarModule,
    InputTextareaModule,
    InputTextModule,
    TooltipModule,
    DropdownModule,
    FloatLabelModule,
    ButtonModule,
    InputNumberModule,
    ScrollPanelModule,
    ChipModule,
    FieldsetModule,
    AutoCompleteModule,
    CheckboxModule,
    SubstituteIpProductModalModule,
    HistoryIpProductModalModule,
    OutSurplusIpProductModalModule,
    AddSurplusIpProductModalModule
  ],
  exports: [
    FormIpProductsComponent
  ]
})
export class FormIpProductsModule { }
