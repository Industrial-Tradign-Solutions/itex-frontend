import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DocsRoutingModule } from './docs-routing.module';
import { DocsComponent } from './docs.component';
import { AccordionModule } from 'primeng/accordion';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';


@NgModule({
  declarations: [
    DocsComponent
  ],
  imports: [
    CommonModule,
    DocsRoutingModule,
    AccordionModule,
    CardModule,
    ButtonModule
  ]
})
export class DocsModule { }
