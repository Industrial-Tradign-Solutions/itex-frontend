import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HandsontableComponent } from './handsontable.component';
import { HotTableModule } from "@handsontable/angular-wrapper";
import { ButtonModule } from 'primeng/button';
import { ScrollPanelModule } from 'primeng/scrollpanel';

@NgModule({
  declarations: [
    HandsontableComponent
  ],
  imports: [
    CommonModule,
    HotTableModule,
    ButtonModule,
    ScrollPanelModule
  ],
  exports: [
    HandsontableComponent
  ]
})
export class HandsontableModule { }
