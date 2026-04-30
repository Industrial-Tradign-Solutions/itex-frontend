import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImportIpProductsComponent } from './import-ip-products.component';
import { HandsontableModule } from '@components/util/handsontable/handsontable.module';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { ScrollPanelModule } from 'primeng/scrollpanel';

@NgModule({
  declarations: [
    ImportIpProductsComponent
  ],
  imports: [
    CommonModule,
    HandsontableModule,
    ProgressBarModule,
    ButtonModule,
    TooltipModule,
    TableModule,
    ScrollPanelModule
],
  exports: [
    ImportIpProductsComponent
  ]
})
export class ImportIpProductsModule { }
