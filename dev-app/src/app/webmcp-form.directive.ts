import {Directive, HostListener, Input, inject} from '@angular/core';
import {ControlContainer} from '@angular/forms';
import {FormRoot} from '@angular/forms/signals';

/** Event extension proposed by WebMCP */
export interface WebMcpSubmitEvent extends SubmitEvent {
  agentInvoked?: boolean;
  respondWith?: (promise: Promise<any>) => void;
}

@Directive({
  selector: 'form[webMcpTool]',
  standalone: true,
  host: {
    '[attr.toolname]': 'webMcpTool',
    '[attr.tooldescription]': 'toolDescription',
    '[attr.toolautosubmit]': 'toolAutoSubmit ? "" : null',
  },
})
export class WebMcpToolDirective {
  /** The name of the WebMCP tool. */
  @Input({required: true}) webMcpTool!: string;

  /** The description of the WebMCP tool. */
  @Input() toolDescription?: string;

  /** Whether the tool should auto-submit when activated by an AI agent. */
  @Input() toolAutoSubmit = true;

  /** Functional submit handler returning a Promise or Observable for WebMCP. */
  @Input() onSubmitTool?: (value: any) => Promise<any> | any;

  private readonly formDir = inject(ControlContainer, {optional: true});
  private readonly signalFormDir = inject(FormRoot, {optional: true});

  @HostListener('submit', ['$event'])
  async onSubmit(event: WebMcpSubmitEvent) {
    if (event.agentInvoked) {
      event.preventDefault();

      const formControl = this.formDir?.control;
      const signalFormTree = this.signalFormDir?.fieldTree();

      let isInvalid = false;
      let errorStatus: any = 'INVALID';
      let formValue: any = undefined;

      if (formControl) {
        isInvalid = formControl.invalid;
        errorStatus = formControl.status;
        formValue = formControl.value;
      } else if (signalFormTree) {
        isInvalid = signalFormTree().invalid();
        errorStatus = isInvalid ? 'INVALID' : 'VALID';
        formValue = signalFormTree().value();
      }

      if (isInvalid) {
        // Automatically reject with generic form error.
        const errorMsg = JSON.stringify({
          error: 'Validation failed',
          details: 'Please check your inputs and try again.',
          status: errorStatus,
        });
        event.respondWith?.(Promise.reject(errorMsg));
        return;
      }

      // Delegate to the developer
      if (this.onSubmitTool) {
        try {
          const result = await Promise.resolve(this.onSubmitTool(formValue));
          event.respondWith?.(Promise.resolve(result));
        } catch (error) {
          event.respondWith?.(Promise.reject(error));
        }
      } else {
        event.respondWith?.(Promise.resolve({success: true, value: formValue}));
      }
    }
  }
}
