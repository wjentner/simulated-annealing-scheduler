import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DateTime } from 'luxon';
import { Observable } from 'rxjs';
import {
    ScheduleConstraints,
    ScheduleConstraintsService,
    TimeConstraint,
} from '../schedule-constraints.service';
import { SelectablePerson, SelectablePersonsService } from '../selectable-persons.service';
import { TasksService } from '../tasks.service';

@Component({
    selector: 'app-time-constraints',
    templateUrl: './time-constraints.component.html',
    styleUrls: ['./time-constraints.component.less'],
    standalone: false
})
export class TimeConstraintsComponent implements OnInit {
    constraints$: Observable<ScheduleConstraints>;
    persons$: Observable<SelectablePerson[]>;
    tasks$: Observable<string[]>;

    constructor(
        private scheduleConstraintsService: ScheduleConstraintsService,
        private personsService: SelectablePersonsService,
        private tasksService: TasksService,
        private _snackBar: MatSnackBar,
    ) {}

    ngOnInit(): void {
        this.constraints$ = this.scheduleConstraintsService.constraints$;

        this.persons$ = this.personsService.selectablePersons$;

        this.tasks$ = this.tasksService.tasks$;
    }

    addTimeConstraint() {
        const d = this.scheduleConstraintsService.constraints$.value;
        d.time_constraints.push({
            person: null,
            negated: false,
            min_date: DateTime.now().toISODate(),
            max_date: DateTime.now().toISODate(),
            task: null,
            penalty: 100000,
        });
        this.scheduleConstraintsService.constraints$.next(d);
    }

    removeTimeConstraint(t: TimeConstraint) {
        const d = this.scheduleConstraintsService.constraints$.value;
        const i = d.time_constraints.indexOf(t);
        if (i > -1) {
            d.time_constraints.splice(i, 1);
        }
        this.scheduleConstraintsService.constraints$.next(d);
        this.save();
    }

    save() {
        this.scheduleConstraintsService.save();
        this._snackBar.open('Saved!', 'OK', { duration: 2000 });
    }
}
