import { Pipe, PipeTransform } from '@angular/core';
import { IpDocumentStatus } from '@interfaces/ip/document-status.type';

@Pipe({
  name: 'ipDocumentStatusColor',
  standalone: false
})
export class IpDocumentStatusColorPipe implements PipeTransform {
  private readonly statusColorMap: Record<IpDocumentStatus, string> = {
    CREATED: 'new',
    SENT: 'renewal',
    ANSWERED: 'negotiation',
    COMPLETE: 'qualified',
    REJECTED: 'unqualified'
  };

  transform(status: IpDocumentStatus | string | undefined | null): string {
    return this.statusColorMap[status as IpDocumentStatus] ?? 'new';
  }
}
