import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, map, mergeMap, Observable, toArray } from 'rxjs';
import {
    MinMaxConstraint,
    ScheduleConstraints,
    ScheduleConstraintsService,
} from '../schedule-constraints.service';
import { SelectablePerson, SelectablePersonsService } from '../selectable-persons.service';
import { TasksService } from '../tasks.service';

@Component({
    selector: 'app-min-max-constraints',
    templateUrl: './min-max-constraints.component.html',
    styleUrls: ['./min-max-constraints.component.less'],
    standalone: false
})
export class MinMaxConstraintsComponent implements OnInit {
    editmode = false;

    constraints$: Observable<ScheduleConstraints>;
    persons$: Observable<SelectablePerson[]>;
    selectablePersons$: Observable<SelectablePerson[]>;
    tasks$: Observable<string[]>;
    personAdd: SelectablePerson;

    constructor(
        private scheduleConstraintsService: ScheduleConstraintsService,
        private personsService: SelectablePersonsService,
        private tasksService: TasksService,
        private _snackBar: MatSnackBar,
    ) {}

    ngOnInit(): void {
        // this.persons$ = this.scheduleConstraintsService.constraints$
        // .pipe(
        //   // map(d => d.)
        // )
        // this.participants$ = this.scheduleConstraintsService.constraints$
        // .pipe(
        //   map(d => d.participants),
        //   tap(d => d.sort((a,b) => a.participant?.name.localeCompare(b.participant?.name)))
        // );

        this.constraints$ = this.scheduleConstraintsService.constraints$;

        this.selectablePersons$ = this.personsService.selectablePersons$.pipe(
            mergeMap(d => d),
            filter(
                d =>
                    !this.scheduleConstraintsService.constraints$.value.min_max_constraints[d.name],
            ),
            toArray(),
        );

        this.tasks$ = this.tasksService.tasks$;

        this.getRemainingPersons().subscribe(p => {
            if (p && p.length > 0) {
                this.personAdd = p[0];
            }
        });
    }

    getMinMax(constraints: { [key: string]: MinMaxConstraint }): string {
        let min = 0;
        let max = 0;
        this.tasksService.tasks$.value.forEach(task => {
            min += constraints[task]?.min || 0;
            max += constraints[task]?.max || 0;
        });
        return min + ' / ' + max;
    }

    addParticipant(person: SelectablePerson) {
        const p = this.scheduleConstraintsService.constraints$.value;

        // todo: add another min max constraint
        p.min_max_constraints[person.name] = {};

        this.scheduleConstraintsService.constraints$.next(p);
    }

    addMinMaxConstraint(person: string, task: string) {
        const d = this.scheduleConstraintsService.constraints$.value;
        d.min_max_constraints[person][task] = {
            min: 0,
            max: 0,
            min_penalty: 100000,
            max_penalty: 100000,
        };
        this.scheduleConstraintsService.constraints$.next(d);
    }

    removeParticipant(person: string) {
        const d = this.scheduleConstraintsService.constraints$.value;
        delete d.min_max_constraints[person];
        this.scheduleConstraintsService.constraints$.next(d);
        this.save();
    }

    removeMinMaxConstraint(person: string, task: string) {
        const d = this.scheduleConstraintsService.constraints$.value;
        delete d.min_max_constraints[person][task];
        this.scheduleConstraintsService.constraints$.next(d);
        this.save();
    }

    getRemainingPersons(): Observable<SelectablePerson[]> {
        return this.constraints$.pipe(
            map(d =>
                this.personsService.selectablePersons$.value.filter(
                    p1 => !d.min_max_constraints[p1.name],
                ),
            ),
        );
    }

    save() {
        this.scheduleConstraintsService.save();
        this._snackBar.open('Saved!', 'OK', { duration: 2000 });
    }
}
