import { Component } from '@angular/core';
import { StorageService } from '@services/util';
import { storageKeys } from '../environments';

const DARK_MODE_KEY = storageKeys.dark_mode;

@Component({
  selector: 'app-root',
  template: `
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  constructor(private storageSV: StorageService) {
    this.storageSV.get(DARK_MODE_KEY).then( (resp: boolean) => {
      if (resp) {
        document.getElementById('theme-link')?.setAttribute('href', 'assets/layout/styles/theme/theme-dark/orange/theme.css');
      } else {
        document.getElementById('theme-link')?.setAttribute('href', 'assets/layout/styles/theme/theme-light/orange/theme.css');
      }
    });
    document.documentElement.style.fontSize = 12 + 'px';
  }
}
