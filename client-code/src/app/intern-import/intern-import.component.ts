import { Component } from '@angular/core';
import { DateTime } from 'luxon';
import { InternImportRequest, InternImportService } from '../intern-import.service';
import { ScheduleConstraints, ScheduleConstraintsService } from '../schedule-constraints.service';
import { Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-intern-import',
    templateUrl: './intern-import.component.html',
    styleUrl: './intern-import.component.less',
    standalone: false,
})
export class InternImportComponent {
    dataSend: InternImportRequest = {
        year: DateTime.now().year,
        user: '',
        password: '',
    };

    removeUserTC = true;

    constraints$: Observable<ScheduleConstraints>;

    constructor(
        private constraintsService: ScheduleConstraintsService,
        private internService: InternImportService,
        private _snackBar: MatSnackBar,
    ) {
        this.constraints$ = this.constraintsService.constraints$.asObservable();
    }

    merge() {
        this.internService.mergeInternData(this.dataSend, this.removeUserTC).subscribe(c => {
            console.log('new constraints', c);
            this.constraintsService.constraints$.next(c);

            // this.constraintsService.save();
            this._snackBar.open('Data Imported!', 'OK', { duration: 2000 });
        });
    }
}
