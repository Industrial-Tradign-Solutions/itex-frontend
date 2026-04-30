import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CryptoService } from './crypto.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor(private cryptoSV: CryptoService) {
  }

  get(key: string): Promise<any> {
    return new Promise(resolve => {
      const val = localStorage.getItem(key);
      if (environment.production) {
        if (val && val !== null) {
          try {
            const decryptData = this.cryptoSV.decryptObject(val, key);
            resolve(decryptData);
          }catch(err) {
            this.delete(key);
            resolve(null);
          }
        } else {
          resolve(null)
        }
      } else {
        if (val) {
          resolve(JSON.parse(val));
        } else {
          resolve(null);
        }
      }
    });
  }

  getPlain<T>(key: string): T | null {
    const val = localStorage.getItem(key);
    if (environment.production) {
      if (val && val !== null) {
        try {
          const decryptData = this.cryptoSV.decryptObject(val, key);
          return decryptData;
        } catch (err) {
          this.delete(key);
          return null;
        }
      }
      return null;
    } else {
      if (val) {
        return JSON.parse(val);
      }
      return null;
    }
  }

  set(key: string, value: any) {
    if (environment.production) {
      const encryptedData = this.cryptoSV.encryptObject(value, key);
      localStorage.setItem(key, encryptedData);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  delete(key: string) {
    localStorage.removeItem(key);
  }

}


