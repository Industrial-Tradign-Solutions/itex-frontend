import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormClientProspectComponent } from './form-client-prospect.component';
import { ProgressBarModule } from 'primeng/progressbar';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { InputNumberModule } from 'primeng/inputnumber';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { ChipModule } from 'primeng/chip';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ContactModalModule } from '@modals/partners/contact-modal/contact-modal.module';

@NgModule({
  declarations: [
    FormClientProspectComponent
  ],
  imports: [
    CommonModule,
    ContactModalModule,
    FormsModule,
    ReactiveFormsModule,
    ProgressBarModule,
    InputTextareaModule,
    InputTextModule,
    TooltipModule,
    DropdownModule,
    FloatLabelModule,
    ButtonModule,
    TableModule,
    TabViewModule,
    InputNumberModule,
    ScrollPanelModule,
    ChipModule,
    AutoCompleteModule
  ],
  exports: [
    FormClientProspectComponent
  ]
})
export class FormClientProspectModule { }
