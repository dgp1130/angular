import {Component, signal} from '@angular/core';
import {
  applyEach,
  form,
  FormField,
  FormRoot,
  min,
  minLength,
  required,
} from '@angular/forms/signals';

@Component({
  selector: 'app-form',
  templateUrl: './form.html',
  imports: [FormField, FormRoot],
})
export class Form {
  readonly user = signal({
    firstName: '',
    lastName: '',
    age: 0,
    hobbies: ['Coding'],
  });

  readonly f = form(
    this.user,
    (u) => {
      required(u.firstName, {message: 'First name is required.'});
      required(u.lastName, {message: 'Last name is required.'});
      required(u.age, {message: 'Age is required.'});
      min(u.age, 0, {message: 'Age must be greater than or equal to 0.'});
      required(u.hobbies, {message: 'Hobbies are required.'});
      minLength(u.hobbies, 1, {message: 'At least one hobby is required.'});
      applyEach(u.hobbies, (hobby) => {
        required(hobby, {message: 'Hobby name is required.'});
      });
    },
    {
      submission: {
        action: async () => {
          alert('Form submitted successfully!\nValue: ' + JSON.stringify(this.user(), null, 2));
          return [];
        },
      },
      experimentalWebMcpTool: {
        name: 'profile-createUser',
        description: 'Create a new user profile.',
      },
    },
  );

  addHobby(): void {
    this.user.update((u) => ({
      ...u,
      hobbies: [...u.hobbies, ''],
    }));
    this.f.hobbies().markAsTouched();
  }

  removeHobby(index: number): void {
    this.user.update((u) => ({
      ...u,
      hobbies: u.hobbies.filter((_, i) => i !== index),
    }));
    this.f.hobbies().markAsTouched();
  }
}
