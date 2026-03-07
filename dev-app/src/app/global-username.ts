import {Component, inject} from '@angular/core';
import {AuthenticatedUser} from './authenticated-user';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-global-username',
  template: `
    <form>
      <div><input type="text" [(ngModel)]="user.name" name="username" /></div>
      <p>User Name: {{ user.name() }}</p>
    </form>
  `,
  imports: [FormsModule],
})
export class GlobalUsername {
  protected readonly user = inject(AuthenticatedUser);
}
