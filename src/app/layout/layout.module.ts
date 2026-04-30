import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { StyleClassModule } from 'primeng/styleclass';
import { DropdownModule } from 'primeng/dropdown';
import { MenuModule } from 'primeng/menu';
import { SidebarModule } from 'primeng/sidebar';
import { RippleModule } from 'primeng/ripple';


import { MenuItemComponent } from './menu-item/menu-item.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FooterComponent } from './footer/footer.component';
import { TopbarComponent } from './topbar/topbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { MenuComponent } from './menu/menu.component';
import { ButtonModule } from 'primeng/button';
import { ProfileModalModule } from '@modals/users/profile-modal/profile-modal.module';


@NgModule({
  declarations: [
    FooterComponent,
    TopbarComponent,
    SidebarComponent,
    BreadcrumbComponent,
    MenuComponent,
    MenuItemComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    MenuModule,
    DropdownModule,
    SidebarModule,
    StyleClassModule,
    RippleModule,
    RouterModule,
    ButtonModule,
    ProfileModalModule
  ],
  exports: [
    FooterComponent,
    TopbarComponent,
    SidebarComponent,
    BreadcrumbComponent,
    MenuComponent,
    MenuItemComponent
  ]
})
export class LayoutPrimeModule { }
