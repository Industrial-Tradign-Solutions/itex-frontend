import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormIpPurchaseOrderComponent } from './form-ip-purchase-order.component';
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
import { ChangeQuotationModalModule } from '@modals/ip/po/change-quotation-modal/change-quotation-modal.module';
import { AddPoProductModalModule } from '@modals/ip/po/add-po-product-modal/add-po-product-modal.module';
import { PoOtherChargesModule } from '@modals/ip/po/po-other-charges/po-other-charges.module';
import { HistoryPurchaseOrderModalModule } from '@modals/ip/po/history-purchase-order-modal/history-purchase-order-modal.module';

@NgModule({
  declarations: [
    FormIpPurchaseOrderComponent
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
    ChangeQuotationModalModule,
    AddPoProductModalModule,
    PoOtherChargesModule,
    HistoryPurchaseOrderModalModule
  ],
  exports: [
    FormIpPurchaseOrderComponent
  ]
})
export class FormIpPurchaseOrderModule { }
