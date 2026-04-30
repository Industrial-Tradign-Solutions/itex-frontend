import { inject, Injectable } from '@angular/core';
import { SendEmailModalComponent } from '@modals/util/email/send-email-modal/send-email-modal.component';
import { DialogService } from 'primeng/dynamicdialog';
import { environment } from '../../../environments/environment';
import { AuthService } from '@services/security';
import { HttpClient } from '@angular/common/http';
import { MessageResponse } from '@interfaces/message-response';
import { catchError, Observable, throwError } from 'rxjs';
import { UtilService } from './util.service';

const URL_SERVICES = environment.api_url + 'email';

@Injectable({
  providedIn: 'root'
})
export class EmailService {


  //! Inyecciones
  private authSV     = inject(AuthService);
  private http       = inject(HttpClient);
  private dialogSV   = inject(DialogService);
  private utilSV     = inject(UtilService);
  //!---------------------------------------

  constructor() { }

  openModalEmail(template: EmailModalTemplate) {
    return this.dialogSV.open(SendEmailModalComponent, {
      header: template.tittle.toUpperCase(),
      width: '50rem',
      closable: false,
      closeOnEscape: false,
      data: {
        template
      }
    });
  }

  sendEmail(data: SentEmail): Observable<MessageResponse<string>> {
    let url  = `${ URL_SERVICES }/sent`;
    return this.http.post<MessageResponse<string>>( url, data, {headers: this.authSV.headers()} )
      .pipe(
        catchError( err => throwError( () => {
          this.utilSV.setMessage('Error', err.error.errorMessage, 'error');
          return err;
        })
      )
    );
  }

  sendEmailAtachments(email: SentEmail, attachments: {fileName: string, content: any}[]): Observable<MessageResponse<string>> {
    let url  = `${ URL_SERVICES }/send-attachment`;
    const formData = new FormData();

    const json = new Blob([JSON.stringify(email)], { type: 'application/json' });
    formData.append('request', json);

    attachments?.forEach(att => {
      if (att.content) {
        formData.append('files', att.content, att.fileName);
      }
    });

    return this.http.post<MessageResponse<string>>( url, formData, {headers: this.authSV.headersMultipart()} )
      .pipe(
        catchError( err => throwError( () => {
          this.utilSV.setMessage('Error', err.error.errorMessage, 'error');
          return err;
        })
      )
    );
  }

  getEmails(emails: string[]): string {
    return emails.join('; ');
  }

  getEmailList(emails: string): string[] {
    return emails
    .split(/[;,:]/)   // separa por ; , :
    .map(item => item.trim()) // elimina espacios en blanco
    .filter(item => item.length > 0); // elimina vacíos si los hay
  }
}

export type SentEmail = {
  to: string[];
  subject: string;
  body: string;
  cc?: string[];
  cco?: string[];
}

export type EmailModalTemplate = {
  tittle: string;
  toTemplate?: string[];
  subjectTemplate?: string;
  bodyTemplate?: string;
  ccTemplate?: string[];
  ccoTemplate?: string[];
  attachmentsTemplate?: AttachmentsTemplate[];
}

type AttachmentsTemplate = {
  name: string;
  data: Blob;
}
