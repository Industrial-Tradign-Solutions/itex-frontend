import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddQuoteRequestsModalComponent } from './add-quote-requests-modal.component';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { PipesModule } from '@pipes/pipes.module';

@NgModule({
  declarations: [
    AddQuoteRequestsModalComponent
  ],
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    ProgressBarModule,
    TagModule,
    PipesModule
  ],
  exports: [
    AddQuoteRequestsModalComponent
  ]
})
export class AddQuoteRequestsModalModule { }
