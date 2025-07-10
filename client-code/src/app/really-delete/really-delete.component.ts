import { Component, EventEmitter, Output } from '@angular/core';

@Component({
    selector: 'app-really-delete',
    template: `
        @if (!really) {
          <button mat-raised-button color="warn" (click)="really = true">
            <ng-content></ng-content>
          </button>
        }
        
        @if (really) {
          <div>
            <button mat-raised-button color="warn" (click)="delete.emit(); really = false">
              Yes, delete</button
              >&nbsp;
              <button mat-raised-button (click)="really = false">No, nevermind</button>
            </div>
          }
        `,
    styleUrls: ['./really-delete.component.less'],
    standalone: false
})
export class ReallyDeleteComponent {
    really = false;

    @Output()
    delete = new EventEmitter<void>();
}
