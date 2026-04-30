import { Component } from '@angular/core';
import { LayoutService } from '../layout.service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styles: []
})
export class FooterComponent {
  constructor(public layoutService: LayoutService) {}

  get colorScheme(): string {
      return this.layoutService.config.colorScheme;
  }
}
