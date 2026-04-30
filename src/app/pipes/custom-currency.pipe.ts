import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'customCurrency'
})
export class CustomCurrencyPipe implements PipeTransform {

  transform(
    value: number,
    currencyCode: string = 'EUR',
    digits: string = '1.2-2'
  ): string {
    if (value == null) return '';

    const [minInt, minFrac, maxFrac] = digits
      .split(/[\.\-]/)
      .map(d => parseInt(d, 10));

    const formatter = new Intl.NumberFormat('de-DE', {
      style: 'decimal', // 👈 usamos solo el número, sin símbolo
      minimumFractionDigits: minFrac || 2,
      maximumFractionDigits: maxFrac || 2
    });

    // Concatenar código + número
    return `${currencyCode} ${formatter.format(value)}`;
  }

}
