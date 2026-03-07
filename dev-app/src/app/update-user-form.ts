import {Component, signal} from '@angular/core';
import {form, FormField, required, FormRoot, TreeValidationResult} from '@angular/forms/signals';

@Component({
  selector: 'app-update-user-form',
  standalone: true,
  imports: [FormField, FormRoot],
  template: `
    <form
      [formRoot]="form"
      toolname="set-name"
      tooldescription="Set the user's first name."
      toolautosubmit
      novalidate
    >
      <div>
        <div>First name: {{ firstName() }}</div>
        <label for="firstname">New first name: </label>
        <input
          type="text"
          id="firstname"
          [formField]="form.firstName"
          toolparamdescription="The new first name to set"
        />

        @if (form.firstName().invalid()) {
          <ul>
            @for (error of form.firstName().errors(); track error) {
              <li>{{ error.message }}</li>
            }
          </ul>
        }
      </div>

      <button type="submit">Update</button>
    </form>
  `,
  styles: `
    form:tool-form-active {
      outline: cyan dashed 2px;
    }
  `,
})
export class UpdateUserForm {
  protected readonly firstName = signal('Doug');

  protected readonly form = form(
    signal({firstName: this.firstName()}),
    (schemaPath) => {
      required(schemaPath.firstName, {message: 'Username is required.'});
    },
    {
      submission: {
        action: async (): Promise<TreeValidationResult> => {
          const newName = this.form().value().firstName;
          // TODO: Should this happen at all?
          if (!newName) {
            return [
              {fieldTree: this.form.firstName, kind: 'custom', message: 'Name cannot be empty.'},
            ];
          }

          if (newName === 'Mark') {
            return [
              {
                fieldTree: this.form.firstName,
                kind: 'custom',
                message: `Sorry, there's only one Mark Techson, and you're not cool enough to be him.`,
              },
            ];
          }

          this.firstName.set(newName);
          return undefined;
        },
      },
    },
  );
}
