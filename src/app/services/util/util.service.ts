import { Injectable, inject } from '@angular/core';
import { ConfirmMessageType } from '@config/types/messages';
import { Confirmation, ConfirmationService, MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class UtilService {

  private messageSV   = inject(MessageService);
  private confirmSV   = inject(ConfirmationService);

  public setMessage(title: string, message: string, severity: ConfirmMessageType) {
    if(severity === 'warn') {
      console.warn(message);
    } else if (severity === 'error') {
      console.error(message);
    }
    this.messageSV.add({
      key: 'main-toast',
      severity,
      detail: message,
      summary: title,
      life: 10000
    });
  }

  public clone<T>(data: T): T {
    return JSON.parse(JSON.stringify(data));
  }

  public confirm(data: Confirmation) {
    const props: Confirmation = {
      message: data.message,
      header: data.header ?? 'Confirmation',
      icon: data.icon ??'pi pi-exclamation-triangle',
      closeOnEscape: data.closeOnEscape ?? false,
      acceptLabel: data.acceptLabel ?? 'Yes',
      rejectLabel: data.rejectLabel ?? 'No',
      accept: data.accept,
      ...data
    };
    this.confirmSV.confirm(props);
  }

  validateUUID(uuid: string): boolean {
    const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidPattern.test(uuid);
  }
}
