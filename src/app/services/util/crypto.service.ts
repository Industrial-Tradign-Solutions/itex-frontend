import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { environment } from '../../../environments/environment';

const KEY_ENCRYPTION = environment.encrypt_data_key;

@Injectable({
  providedIn: 'root'
})
export class CryptoService {

  constructor() { }

  encryptObject(obj: any, varKey: string): string {
    const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(obj), `${KEY_ENCRYPTION}_${varKey}`).toString();
    return ciphertext;
  }

  decryptObject(ciphertext: string, varKey: string): any {
    const bytes  = CryptoJS.AES.decrypt(ciphertext, `${KEY_ENCRYPTION}_${varKey}`);
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    return decryptedData;
  }
}
