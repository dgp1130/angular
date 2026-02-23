/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

/// <reference types="chrome"/>

isGoogler().then((isGoogler) => {
  const theme = chrome.devtools.panels.themeName;
  chrome.devtools.panels.create(
    isGoogler ? 'Angular & Wiz' : 'Angular',
    // Firefox specifically displays the icon in the tab.
    // the bw icon wasn't visible in dark mode
    theme === 'dark' ? 'assets/icon16.png' : 'assets/icon-bw16.png',
    'index.html',
  );
});

async function isGoogler(): Promise<boolean> {
  try {
    const response = await fetch(
      'https://g3doc.corp.google.com/does/not/exist/for/angular/devtools',
    );
    console.log(response);
    return response.ok || (response.status >= 400 && response.status < 500);
  } catch (e) {
    console.log(e);
    return false;
  }
}
