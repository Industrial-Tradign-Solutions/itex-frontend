import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PhonePipe } from './phone.pipe';
import { CustomCurrencyPipe } from './custom-currency.pipe';



@NgModule({
  declarations: [
    PhonePipe,
    CustomCurrencyPipe
  ],
  imports: [
    CommonModule
  ],
  exports: [
    PhonePipe,
    CustomCurrencyPipe
  ]
})
export class PipesModule { }
