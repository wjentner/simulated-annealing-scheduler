import { Component, EventEmitter, Output } from '@angular/core';

@Component({
    selector: 'app-really-delete',
    template: `
        <button *ngIf="!really" mat-raised-button color="warn" (click)="really = true">
            <ng-content></ng-content>
        </button>

        <div *ngIf="really">
            <button mat-raised-button color="warn" (click)="delete.emit(); really = false">
                Yes, delete</button
            >&nbsp;
            <button mat-raised-button (click)="really = false">No, nevermind</button>
        </div>
    `,
    styleUrls: ['./really-delete.component.less'],
})
export class ReallyDeleteComponent {
    really = false;

    @Output()
    delete = new EventEmitter<void>();
}
