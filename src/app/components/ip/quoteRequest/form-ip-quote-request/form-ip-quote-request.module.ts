import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormIpQuoteRequestComponent } from './form-ip-quote-request.component';
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
import { QuoteRequestProductModalModule } from '@modals/ip/qr/quote-request-product-modal/quote-request-product-modal.module';
import { ListOtherChargesModalModule } from '@modals/ip/qr/list-other-charges-modal/list-other-charges-modal.module';
import { SendEmailModalModule } from '@modals/util/email/send-email-modal/send-email-modal.module';
import { HistoryQuoteRequestModalModule } from '@modals/ip/qr/history-quote-request-modal/history-quote-request-modal.module';



@NgModule({
  declarations: [
    FormIpQuoteRequestComponent
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
    PipesModule,
    QuoteRequestProductModalModule,
    ListOtherChargesModalModule,
    SendEmailModalModule,
    HistoryQuoteRequestModalModule
  ],
  exports: [
    FormIpQuoteRequestComponent
  ]
})
export class FormIpQuoteRequestModule { }
