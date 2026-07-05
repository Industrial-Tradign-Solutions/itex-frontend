import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddQuoteRequestsModalComponent } from './add-quote-requests-modal.component';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { PipesModule } from '@pipes/pipes.module';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    AddQuoteRequestsModalComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    TableModule,
    ProgressBarModule,
    TagModule,
    PipesModule,
    CheckboxModule
  ],
  exports: [
    AddQuoteRequestsModalComponent
  ]
})
export class AddQuoteRequestsModalModule { }
