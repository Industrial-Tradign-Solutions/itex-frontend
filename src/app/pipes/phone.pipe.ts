import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'phone'
})
export class PhonePipe implements PipeTransform {

  transform(value: number | string): string {
    if(!value) return '';
    const phoneString = value.toString().padStart(7, '0');
    const formattedPhone = `${phoneString.substring(0, 3)}-${phoneString.substring(3)}`;
    return formattedPhone;
  }

}
