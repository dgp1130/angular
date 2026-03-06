import {Component, inject, signal} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {form, FormField, required, submit} from '@angular/forms/signals';
import {AuthenticatedUser} from './authenticated-user';

export interface WebMcpSubmitEvent extends SubmitEvent {
  agentInvoked?: boolean;
  respondWith?: (promise: Promise<any>) => void;
}

@Component({
  selector: 'app-update-user-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormField],
  template: `
    <form
      toolname="set-user-name"
      tooldescription="Set the value of the user name."
      toolautosubmit
      novalidate
      (submit)="onSubmit($event)"
    >
      <div>
        <label for="usernameInput">New Username</label>
        <input
          type="text"
          id="usernameInput"
          [formField]="form.userName"
          toolparamdescription="The new username to set"
        />
        @if (form.userName().invalid()) {
          <ul>
            @for (error of form.userName().errors(); track error) {
              <li>{{ error.message }}</li>
            }
          </ul>
        }
      </div>

      <button type="submit">Update</button>
    </form>
  `,
  styles: `
    form {
      border: 1px solid #ccc;
      padding: 16px;
      margin-top: 16px;
      border-radius: 4px;
    }
    form:tool-form-active {
      outline: cyan dashed 2px;
    }
  `,
})
export class UpdateUserForm {
  protected readonly user = inject(AuthenticatedUser);

  protected readonly form = form(signal({userName: this.user.name()}), (schemaPath) => {
    required(schemaPath.userName, {message: 'Username is required.'});
  });

  onSubmit(event: WebMcpSubmitEvent) {
    event.preventDefault();

    event.respondWith!(
      submit(this.form, async () => {
        const newName = this.form().value().userName;
        if (newName) {
          this.user.name.set(newName);
          return undefined;
        } else {
          // [{fieldTree: this.form.userName, kind: 'custom', message: 'Name cannot be empty'}];
          throw new Error('Name cannot be empty');
        }
      }).then((success) => (success ? 'Success!' : 'Failure.')),
    );
  }
}
