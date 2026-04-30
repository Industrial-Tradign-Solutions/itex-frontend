import { IpProductsService } from '@services/ip';
import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import { HandsontableComponent } from '@components/util/handsontable/handsontable.component';
import { environment } from '../../../../../environments/environment';
import { finalize } from 'rxjs';
import { UtilService } from '@services/util';
import { TitlesMessages } from '@config/messages';
import { IpImportProductsRequest, IpImportProductsResponse, IpImportProductsValidateRequest } from '@interfaces/ip/products/ipProductImportRequest.type';

const TIMEOUT = environment.timeout;
const TITLE_MESSAGES = TitlesMessages;

@Component({
  selector: 'app-import-ip-products',
  templateUrl: './import-ip-products.component.html',
  styleUrl: './import-ip-products.component.scss'
})
export class ImportIpProductsComponent {

  @ViewChild(HandsontableComponent) handsontable!: HandsontableComponent;

  private productSV = inject(IpProductsService);
  private utilSV    = inject(UtilService);

  private _loading = signal<boolean>(false);
  loading = computed<boolean>(() => this._loading());

  private _data = signal<IpImportProductsResponse[]>([]);
  data = computed<IpImportProductsResponse[]>(() => this._data());

  private _showHandsonTable = signal<boolean>(true);
  showHandsonTable = computed<boolean>(() => this._showHandsonTable());

  otherData: string[][] = [];

  headers = [
    'Description',
    'MFR Reference',
    'Client Description',
    'Client Reference',
    'Brand',
    'Freight Class',
    'Net Weight Lbs',
    'NMFC',
    'HTS Schedule B #',
    'ECCN',
    'COO',
    'Battery',
    'Hazmat',
    'Dual Use'
  ];

  example = [
    'Product description',
    '',
    '',
    '',
    'Created Brand',
    'example: 55',
    'example: 3.0',
    'number, example: 3',
    'number, example: 6',
    '',
    'example: USA',
    'Yes / No',
    'Yes / No',
    'Yes / No'
  ];

  validateData(data: any[]) {
    if(data.length <= 1) return;
    this._loading.set(true);
    this._data.set([]);
    const request = this.configData(data);
    this.productSV.validateImportProduct(request)
    .pipe(
      finalize(() =>{
        setTimeout(() => {
          this._loading.set(false);
        }, TIMEOUT);
      })
    )
    .subscribe({
      next: (resp) => {
        this._showHandsonTable.set(false);
        this._data.set(resp);
      }, error: (err) => {
        this.configOtherDataRequest(request);
        this.utilSV.setMessage(TITLE_MESSAGES.error, err, 'error');
        this._showHandsonTable.set(true);
      }
    });
  }

  private configOtherDataRequest(data: IpImportProductsValidateRequest[]) {
    this.otherData = [];
    data.forEach(prod => {
      let row: string[] = [];
      row.push(prod.description ?? '');
      row.push(prod.mfrReference ?? '');
      row.push(prod.clientDescription ?? '');
      row.push(prod.clientReference ?? '');
      row.push(prod.brandStr ?? '');
      row.push(prod.freightClass ?? '');
      row.push(prod.netWeightLbs?.toString() ?? '');
      row.push(prod.nmfc?.toString() ?? '');
      row.push(prod.htsScheduleBNumber?.toString() ?? '');
      row.push(prod.eccn ?? '');
      row.push(prod.cooStr ?? '');
      row.push(prod.battery ? 'YES' : 'NO');
      row.push(prod.hazmat ? 'YES' : 'NO');
      row.push(prod.dualUse ? 'YES' : 'NO');
      this.otherData.push(row);
    });
  }

    private configOtherDataResponse(data: IpImportProductsResponse[]) {
    this.otherData = [];
    data.forEach(prod => {
      let row: string[] = [];
      row.push(prod.description ?? '');
      row.push(prod.mfrReference ?? '');
      row.push(prod.clientDescription ?? '');
      row.push(prod.clientReference ?? '');
      row.push(prod.brand.name ?? '');
      row.push(prod.freightClass ?? '');
      row.push(prod.netWeightLbs?.toString() ?? '');
      row.push(prod.nmfc?.toString() ?? '');
      row.push(prod.htsScheduleBNumber?.toString() ?? '');
      row.push(prod.eccn ?? '');
      row.push(prod.coo.name ?? '');
      row.push(prod.battery ? 'YES' : 'NO');
      row.push(prod.hazmat ? 'YES' : 'NO');
      row.push(prod.dualUse ? 'YES' : 'NO');
      this.otherData.push(row);
    });
  }


  saveAction() {
    this._loading.set(true);
    this.productSV.importProduct(this.getRequestData())
    .pipe(
      finalize(() =>{
        setTimeout(() => {
          this._loading.set(false);
        }, TIMEOUT);
      })
    )
    .subscribe({
      next: (resp) => {
        this.otherData = [];
        this._showHandsonTable.set(true);
        this._data.set([]);
        this.utilSV.setMessage(resp.title, resp.message, 'success');
      }, error: (err) => {
        this.configOtherDataResponse(this.data());
        this.utilSV.setMessage(TITLE_MESSAGES.error, err, 'error');
        this._showHandsonTable.set(false);
      }
    });

  }

  private getRequestData(): IpImportProductsRequest[] {
    const data = this.utilSV.clone<IpImportProductsResponse[]>(this.data());
    let resp: IpImportProductsRequest[] = []
    data.forEach(item => {
      if (item.description && item.description !== '') {
        resp.push({
          brandId: item?.brand?.id ?? null,
          description: item.description,
          clientDescription: item.clientDescription,
          mfrReference: item.mfrReference,
          clientReference: item.clientReference,
          netWeightLbs: item.netWeightLbs,
          nmfc: item.nmfc,
          freightClass: item.freightClass,
          htsScheduleBNumber: item.htsScheduleBNumber,
          eccn: item.eccn,
          cooId: item?.coo?.id ?? null,
          battery: item.battery,
          hazmat: item.hazmat,
          dualUse: item.dualUse,
          validImport: item.validImport,
          saveBrand: item.saveBrand,
          saveCoo: item.saveCoo,
        });
      }
    });
    return resp;
  }

  getFreighClass(val: string): string {
    if (val) {
      return val.replace('F', '').replace('_', ',');
    }
    return '';
  }

  cancelAction() {
    this.configOtherDataResponse(this.data());
    this._showHandsonTable.set(true);
    this._data.set([]);
  }

  getClass(product: IpImportProductsResponse) {
    if (!product.validImport) {
      return {
        'row-success': false,
        'row-error': true,
        'row-warning': false
      }
    }else if (product.importErrors.length > 0) {
      return {
        'row-success': false,
        'row-error': false,
        'row-warning': true
      }
    } else {
      return {
        'row-success': true,
        'row-error': false,
        'row-warning': false
      }
    }
  }

  private configData(data: any[]): IpImportProductsValidateRequest[] {
    return data.map(prod => {

      if (prod.freightClass && prod.freightClass !== '' && prod.freightClass !== 'example: 55'){
        if (!isNaN(Number(prod.freightClass.replace(',', '.')))) {
          prod.freightClass = 'F' + prod.freightClass.replace('.', '_').replace(',', '_');
        } else {
          prod.freightClass = null;
        }
      } else {
        prod.freightClass = null;
      }

      if (prod.netWeightLbs && prod.netWeightLbs !== '') {
        if (!isNaN(Number(prod.netWeightLbs.replace('.', '').replace(',', '.')))) {
          prod.netWeightLbs = Number(prod.netWeightLbs.replace('.', '').replace(',', '.'));
        } else {
          prod.netWeightLbs = null;
        }
      } else {
        prod.netWeightLbs = null;
      }

      if (prod.nmfc && prod.nmfc !== '') {
        if (!isNaN(Number(prod.nmfc.replace('.', '').replace(',', '.')))) {
          prod.nmfc = Number(prod.nmfc.replace('.', '').replace(',', '.'));
        } else {
          prod.nmfc = null;
        }
      } else {
        prod.nmfc = null;
      }

      if (prod.htsScheduleBNumber && prod.htsScheduleBNumber !== '') {
        if (!isNaN(Number(prod.htsScheduleBNumber.replace('.', '').replace(',', '.')))) {
          prod.htsScheduleBNumber = Number(prod.htsScheduleBNumber.replace('.', '').replace(',', '.'));
        } else {
          prod.htsScheduleBNumber = null;
        }
      } else {
        prod.htsScheduleBNumber = null;
      }

      if (prod.clientDescription === '') {
        prod.clientDescription = null;
      }

      if (prod.clientReference === '') {
        prod.clientReference = null;
      }

      if (prod.eccn === '') {
        prod.eccn = null;
      }

      if (prod.mfrReference === '') {
        prod.mfrReference = null;
      }

      if (prod.coo && prod.coo !== '' && prod.coo !== 'example: USA') {
        prod.cooStr = prod.coo;
        delete prod.coo;
      }

      if (prod.brand && prod.brand !== '' && prod.brand !== 'Created Brand') {
        prod.brandStr =  prod.brand;
        delete prod.brand;
      }

      prod.battery = (prod.battery !== '' && prod.battery.toLowerCase().trim() === 'yes');
      prod.hazmat = (prod.hazmat !== '' && prod.hazmat.toLowerCase().trim() === 'yes');
      prod.dualUse = (prod.dualUse !== '' && prod.dualUse.toLowerCase().trim() === 'yes');

      return prod;
    });
  }
}
