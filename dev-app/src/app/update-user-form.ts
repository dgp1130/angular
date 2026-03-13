import {Component, signal} from '@angular/core';
import {
  form,
  FormField,
  required,
  FormRoot,
  parameter,
  email,
  oneOf,
  applyEach,
} from '@angular/forms/signals';

@Component({
  selector: 'app-update-user-form',
  standalone: true,
  imports: [FormField, FormRoot],
  template: `
    <div class="container">
      <h3>User Profile Settings</h3>
      <p>
        This form is automatically available as a WebMCP tool (<code>update-user-profile</code>).
      </p>

      <form [formRoot]="userForm" novalidate>
        <div class="row">
          <div class="field">
            <label>First Name</label>
            <input [formField]="userForm.firstName" placeholder="First Name" />
            @if (userForm.firstName().invalid()) {
              <span class="error">Required</span>
            }
          </div>

          <div class="field">
            <label>Last Name</label>
            <input [formField]="userForm.lastName" placeholder="Last Name" />
            @if (userForm.lastName().invalid()) {
              <span class="error">Required</span>
            }
          </div>
        </div>

        <div class="field">
          <label>Email</label>
          <input [formField]="userForm.email" type="email" placeholder="email@example.com" />
          @if (userForm.email().invalid()) {
            <span class="error">Invalid email</span>
          }
        </div>

        <div class="group">
          <h4>Address</h4>
          <div class="row">
            <div class="field">
              <label>City</label>
              <input [formField]="userForm.address.city" />
            </div>
            <div class="field">
              <label>Zip Code</label>
              <input [formField]="userForm.address.zip" />
            </div>
          </div>
        </div>

        <div class="group">
          <h4>Hobbies</h4>
          <div class="hobbies-list">
            @for (hobby of userForm.hobbies; track hobby; let i = $index) {
              <div class="hobby-item">
                <div class="hobby-inputs">
                  <div class="field">
                    <label>Name</label>
                    <input [formField]="hobby.name" placeholder="Hobby name" />
                    @if (hobby.name().invalid()) {
                      <span class="error">Required</span>
                    }
                  </div>
                  <div class="field">
                    <label>Description</label>
                    <input [formField]="hobby.description" placeholder="Description" />
                  </div>
                </div>
                <button type="button" class="remove-btn" (click)="removeHobby(i)">×</button>
              </div>
            }
          </div>
          <button type="button" class="add-btn" (click)="addHobby()">+ Add Hobby</button>
        </div>

        <div class="group">
          <h4>Preferences</h4>
          <div class="field">
            <label class="checkbox">
              <input type="checkbox" [formField]="userForm.preferences.newsletter" />
              Subscribe to Newsletter
            </label>
          </div>
          <div class="field">
            <label>Theme</label>
            <select [formField]="userForm.preferences.theme">
              @for (option of userForm.preferences.theme().options(); track option.value) {
                <option [value]="option.value">
                  {{ option.label }}
                </option>
              }
            </select>
          </div>
        </div>

        <button type="submit" [disabled]="userForm().submitting()">
          @if (userForm().submitting()) {
            Saving...
          } @else {
            Save Profile
          }
        </button>

        @if (submitStatus()) {
          <p class="status">{{ submitStatus() }}</p>
        }
      </form>
    </div>
  `,
  styles: `
    .container {
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
      border: 1px solid #eee;
      border-radius: 8px;
      font-family: sans-serif;
    }
    .row {
      display: flex;
      gap: 20px;
    }
    .hobbies-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 15px;
    }
    .hobby-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: #fff;
      border: 1px solid #ddd;
      padding: 12px;
      border-radius: 8px;
    }
    .hobby-inputs {
      display: flex;
      gap: 15px;
      flex: 1;
    }
    .hobby-inputs .field {
      margin-bottom: 0;
    }
    .field {
      margin-bottom: 15px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .field label {
      font-size: 14px;
      margin-bottom: 5px;
      color: #666;
    }
    .field input,
    .field select {
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    .field .checkbox {
      flex-direction: row;
      align-items: center;
      gap: 8px;
    }
    .group {
      border: 1px solid #f0f0f0;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
      background: #fafafa;
    }
    .group h4 {
      margin-top: 0;
      margin-bottom: 10px;
      color: #444;
    }
    .error {
      color: red;
      font-size: 11px;
      margin-top: 2px;
    }
    .status {
      font-weight: bold;
      color: #2e7d32;
      padding: 10px;
      background: #e8f5e9;
      border-radius: 4px;
      margin-top: 10px;
    }
    button {
      background: #1976d2;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
    }
    button:disabled {
      background: #ccc;
    }
    .add-btn {
      background: #43a047;
      padding: 6px 12px;
      font-size: 12px;
    }
    .remove-btn {
      background: none;
      color: #888;
      border: none;
      font-size: 18px;
      padding: 0 4px;
      line-height: 1;
      cursor: pointer;
    }
    .remove-btn:hover {
      color: #e53935;
    }
    form:tool-form-active {
      outline: 2px solid #00acc1;
    }
  `,
})
export class UpdateUserForm {
  protected readonly submitStatus = signal('');

  protected readonly userModel = signal({
    firstName: 'Doug',
    lastName: 'Parker',
    email: 'douglas@example.com',
    address: {
      city: 'Mountain View',
      zip: '94043',
    },
    preferences: {
      newsletter: true,
      theme: 'dark' as 'light' | 'dark',
    },
    hobbies: [
      {name: 'Coding', description: 'Writing code'},
      {name: 'Cycling', description: 'Riding a bike'},
    ],
  });

  protected readonly userForm = form(
    this.userModel,
    (p) => {
      parameter(p.firstName, "The user's first name");
      required(p.firstName);

      parameter(p.lastName, "The user's last name");
      required(p.lastName);

      required(p.email);
      email(p.email);

      parameter(p.address.city, 'The city of residence');

      oneOf(p.preferences.theme, [
        {value: 'light', label: 'Light', description: 'A bright, clean interface.'},
        {value: 'dark', label: 'Dark', description: 'Easier on the eyes in low light.'},
      ]);

      applyEach(p.hobbies, (hobby) => {
        required(hobby.name);
      });
    },
    {
      tool: {
        name: 'update-user-profile',
        description:
          'Updates all user profile settings including address, hobbies, and preferences.',
        allowAutoSubmit: true,
      },
      submission: {
        action: async () => {
          // Simulate network delay
          await new Promise((resolve) => setTimeout(resolve, 1000));
          this.submitStatus.set(
            'Profile updated successfully at ' + new Date().toLocaleTimeString(),
          );
          return undefined;
        },
      },
    },
  );

  protected addHobby() {
    this.userModel.update((m) => ({...m, hobbies: [...m.hobbies, {name: '', description: ''}]}));
  }

  protected removeHobby(index: number) {
    this.userModel.update((m) => ({
      ...m,
      hobbies: m.hobbies.filter((_, i) => i !== index),
    }));
  }
}
