import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormIpPurchaseOrderComponent } from './form-ip-purchase-order.component';
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
import { FieldsetModule } from 'primeng/fieldset';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { PipesModule } from '@pipes/pipes.module';

@NgModule({
  declarations: [
    FormIpPurchaseOrderComponent
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
    TabViewModule,
    TableModule,
    PipesModule
  ],
  exports: [
    FormIpPurchaseOrderComponent
  ]
})
export class FormIpPurchaseOrderModule { }
