/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Component, inject, Injectable, signal} from '@angular/core';
import {RouterLink, RouterOutlet} from '@angular/router';

@Injectable({providedIn: 'root'})
export class Counter {
  readonly count = signal(0);

  increment(amount: number): number {
    this.count.update((c) => c + amount);
    return this.count();
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  imports: [RouterLink, RouterOutlet],
})
export class App {}
