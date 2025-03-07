/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {ComponentType} from 'protocol';

import {ElementPropertyResolver} from '../property-resolver/element-property-resolver';
import {ɵFramework} from '@angular/core';

@Component({
  selector: 'ng-component-metadata',
  templateUrl: './component-metadata.component.html',
  styleUrls: ['./component-metadata.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentMetadataComponent {
  readonly currentSelectedComponent = input.required<ComponentType>();

  private _nestedProps = inject(ElementPropertyResolver);

  angularViewEncapsulationModes = ['Emulated', 'Native', 'None', 'ShadowDom'];
  acxViewEncapsulationModes = ['Emulated', 'None'];

  readonly controller = computed(() => {
    const comp = this.currentSelectedComponent();
    if (!comp) {
      return;
    }
    return this._nestedProps.getDirectiveController(comp.name);
  });

  readonly viewEncapsulation = computed(() => {
    const metadata = this.controller()?.directiveMetadata;
    if (!metadata) return undefined;

    switch (metadata.framework) {
      case ɵFramework.Angular:
        return this.angularViewEncapsulationModes[metadata.encapsulation];
      case ɵFramework.Acx:
        return this.acxViewEncapsulationModes[metadata.encapsulation];
      default:
        return undefined;
    }
  });

  readonly changeDetectionStrategy = computed(() => {
    const metadata = this.controller()?.directiveMetadata;
    if (!metadata) return undefined;

    if ('onPush' in metadata) {
      return metadata.onPush ? 'OnPush' : 'Default';
    } else {
      return undefined;
    }
  });
}
