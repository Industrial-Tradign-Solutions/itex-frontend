import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormIpQuotationComponent } from './form-ip-quotation.component';
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
import { SendEmailModalModule } from '@modals/util/email/send-email-modal/send-email-modal.module';
import { QuotationProductModalModule } from '@modals/ip/q/quotation-product-modal/quotation-product-modal.module';
import { OtherChargesModalModule } from '@modals/ip/q/other-charges-modal/other-charges-modal.module';
import { ListOtherChargesModalModule } from '@modals/ip/q/list-other-charges-modal/list-other-charges-modal.module';
import { AddQuoteRequestsModalModule } from '@modals/ip/q/add-quote-requests-modal/add-quote-requests-modal.module';
import { DividerModule } from 'primeng/divider';



@NgModule({
  declarations: [
    FormIpQuotationComponent
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
    SendEmailModalModule,
    QuotationProductModalModule,
    OtherChargesModalModule,
    ListOtherChargesModalModule,
    AddQuoteRequestsModalModule,
    DividerModule
  ],
  exports: [
    FormIpQuotationComponent
  ]
})
export class FormIpQuotationModule { }
