import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhonePipe } from './phone.pipe';
import { CustomCurrencyPipe } from './custom-currency.pipe';
import { IpDocumentStatusColorPipe } from './ip-document-status-color.pipe';



@NgModule({
  declarations: [
    PhonePipe,
    CustomCurrencyPipe,
    IpDocumentStatusColorPipe
  ],
  imports: [
    CommonModule
  ],
  exports: [
    PhonePipe,
    CustomCurrencyPipe,
    IpDocumentStatusColorPipe
  ]
})
export class PipesModule { }
