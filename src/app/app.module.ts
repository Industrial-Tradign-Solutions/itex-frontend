import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { AuthInterceptor } from '@config/interceptors';
import { PhonePipe } from '@pipes/phone.pipe';
import { PipesModule } from '@pipes/pipes.module';


@NgModule(
  { declarations: [
      AppComponent
    ],
    bootstrap: [
      AppComponent
    ],
    imports: [
      BrowserModule,
      BrowserAnimationsModule,
      AppRoutingModule,
      PipesModule
    ],
    providers: [
      MessageService,
      ConfirmationService,
      DialogService,
      {
        provide: HTTP_INTERCEPTORS,
        useClass: AuthInterceptor,
        multi: true
      },
      provideHttpClient(withInterceptorsFromDi()),
      PhonePipe
    ]
  })
export class AppModule { }
