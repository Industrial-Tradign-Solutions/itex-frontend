import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TooltipModule } from 'primeng/tooltip';
import { PipesModule } from '@pipes/pipes.module';
import { PoListOtherChargesModalComponent } from '../po-list-other-charges-modal/po-list-other-charges-modal.component';
import { PoOtherChargesModalComponent } from '../po-other-charges-modal/po-other-charges-modal.component';
import { PoImportOtherChargesModalComponent } from '../po-import-other-charges-modal/po-import-other-charges-modal.component';

@NgModule({
  declarations: [
    PoListOtherChargesModalComponent,
    PoOtherChargesModalComponent,
    PoImportOtherChargesModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ProgressBarModule,
    ButtonModule,
    CheckboxModule,
    TableModule,
    InputTextModule,
    InputNumberModule,
    FloatLabelModule,
    TooltipModule,
    PipesModule
  ],
  exports: [
    PoListOtherChargesModalComponent,
    PoOtherChargesModalComponent,
    PoImportOtherChargesModalComponent
  ]
})
export class PoOtherChargesModule { }
