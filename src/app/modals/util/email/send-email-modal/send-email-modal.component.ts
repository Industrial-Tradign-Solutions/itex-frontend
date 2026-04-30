import { Component, computed, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { EmailModalTemplate, EmailService, SentEmail } from '@services/util/email.service';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { environment } from '../../../../../environments/environment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize, Observable } from 'rxjs';
import { MessageResponse } from '@interfaces/message-response';
import { UtilService } from '@services/util';

const TIMEOUT = environment.timeout;

@Component({
  selector: 'app-send-email-modal',
  templateUrl: './send-email-modal.component.html',
  styleUrl: './send-email-modal.component.scss'
})
export class SendEmailModalComponent implements OnInit{
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  //! Inyecciones
  private config      = inject(DynamicDialogConfig);
  private ref         = inject(DynamicDialogRef);
  private formBuilder = inject(FormBuilder);
  private emailSV     = inject(EmailService);
  private utilSV      = inject(UtilService);
  //! ----------------------------------------------
  //* Señales
  private _template = signal<EmailModalTemplate>(this.config.data.template);
  template = computed<EmailModalTemplate>(() => this._template());
  private _loading = signal<boolean>(true);
  loading = computed<boolean>(() => this._loading());
  //*----------------------------------------------------------------

  atachments: {fileName: string, content: any}[] = [];
  acceptedTypes = '.xls,.xlsx,.pdf,.doc,.docx,.png,.jpg,.jpeg';

  formEmail!: FormGroup;

  ngOnInit(): void {
    setTimeout(() => {
      this.buildForm();
      this._loading.set(false);
    }, TIMEOUT);
  }

  editorModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'align': [] }]
    ]
  };

  onSubmit() {
    this._loading.set(true);
    this.getAction()
    .pipe(finalize(() => {
      setTimeout(() => {
        this._loading.set(false)
      }, TIMEOUT);
    }))
    .subscribe({
      next: (resp) => {
        this.utilSV.setMessage(resp.title, resp.message, 'success');
        this.ref.close({valid: true});
      }
    });
  }

  private getAction(): Observable<MessageResponse<string>>  {
    const data = this.formEmail.value;
    let emailInfo: SentEmail = {
        to: this.emailSV.getEmailList(data.to),
        cc: this.emailSV.getEmailList(data.cc),
        cco: this.emailSV.getEmailList(data.cco),
        subject: data.subject,
        body: data.body,
    };
    if (this.atachments.length > 0) {
      return this.emailSV.sendEmailAtachments(emailInfo, this.atachments);
    } else {
      return this.emailSV.sendEmail(emailInfo);
    }
  }

  closeModal() {
    this.ref.close({valid: false});
  }

  private buildForm(): void {
    this.formEmail = this.formBuilder.group({
      subject: [
        this.template().subjectTemplate || '',
        [
          Validators.required
        ]
      ],
      to: [
        this.emailSV.getEmails(this.template().toTemplate || []),
        [
          Validators.required
        ]
      ],
      cc: [
        this.emailSV.getEmails(this.template().ccTemplate || [])
      ],
      cco: [
        this.emailSV.getEmails(this.template().ccoTemplate || [])
      ],
      body: [
        this.template().bodyTemplate || '',
        [
          Validators.required
        ]
      ]
    });
    if (this.template().attachmentsTemplate && this.template().attachmentsTemplate!.length > 0) {
      this.template().attachmentsTemplate!.forEach( att => {
        this.atachments.push({fileName: att.name, content: att.data});
      });
    }
  }

  onFilesSelected(fileEvent:any ) {
    const input = fileEvent.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);

    const allowedExtensions = this.acceptedTypes.split(',');
    const validFiles = files.filter(file =>
      allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
    );

    if (validFiles.length < files.length) {
      alert('⚠️ Algunos archivos fueron ignorados por no tener una extensión válida.');
    }

    validFiles.forEach(file => {
      this.atachments.push({fileName: file.name, content: file});
    });
    input.value = '';
  }

  openFileDialog() {
    this.fileInput.nativeElement.click();
  }
}
