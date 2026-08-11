import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PipesModule } from '@pipes/pipes.module';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { FieldsetModule } from 'primeng/fieldset';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { StatementInvoiceComponent } from './statement-invoice.component';

@NgModule({
  declarations: [
    StatementInvoiceComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    PipesModule,
    AutoCompleteModule,
    ButtonModule,
    FieldsetModule,
    FloatLabelModule,
    ProgressBarModule,
    TableModule,
    TooltipModule
  ],
  exports: [
    StatementInvoiceComponent
  ]
})
export class StatementInvoiceModule { }
