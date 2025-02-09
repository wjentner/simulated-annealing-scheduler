import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DateTime } from 'luxon';
import { Observable } from 'rxjs';
import {
    AdjacentTaskConstraint,
    ScheduleConstraints,
    ScheduleConstraintsService,
    TimeConstraint,
} from '../schedule-constraints.service';
import { SelectablePerson, SelectablePersonsService } from '../selectable-persons.service';
import { TasksService } from '../tasks.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
    selector: 'app-adjacent-task-constraints',
    templateUrl: './adjacent-task-constraints.component.html',
    styleUrls: ['./adjacent-task-constraints.component.less'],
    standalone: false,
})
export class AdjacentTaskConstraintsComponent implements OnInit {
    constraints$: Observable<ScheduleConstraints>;
    persons$: Observable<SelectablePerson[]>;
    tasks$: Observable<string[]>;

    constructor(
        private scheduleConstraintsService: ScheduleConstraintsService,
        private personsService: SelectablePersonsService,
        private tasksService: TasksService,
        private _snackBar: MatSnackBar,
        private sanitizer: DomSanitizer,
    ) {}

    ngOnInit(): void {
        this.constraints$ = this.scheduleConstraintsService.constraints$;

        this.persons$ = this.personsService.selectablePersons$;

        this.tasks$ = this.tasksService.tasks$;
    }

    addAdjacentTaskConstrint() {
        const d = this.scheduleConstraintsService.constraints$.value;
        d.adjacent_task_constraints.push({
            person: null,
            negated: false,
            own_task: null,
            adjacent_task: null,
            adjacent_person: null,
            penalty: 100000,
        });
        this.scheduleConstraintsService.constraints$.next(d);
    }

    removeAdjacentTaskConstraint(t: AdjacentTaskConstraint) {
        const d = this.scheduleConstraintsService.constraints$.value;
        const i = d.adjacent_task_constraints.indexOf(t);
        if (i > -1) {
            d.adjacent_task_constraints.splice(i, 1);
        }
        this.scheduleConstraintsService.constraints$.next(d);
        this.save();
    }

    getConstraintExplanation(c: AdjacentTaskConstraint): string | SafeHtml {
        try {
            if (!c.person) {
                throw 'A person must be selected';
            }

            if (!c.adjacent_person && !c.adjacent_task) {
                throw 'Either an other person or an other task must be selected';
            }

            if (c.person === c.adjacent_person) {
                throw 'Person and other person must be different!';
            }

            let ret = `When person "${c.person}" is scheduled`;

            if (c.own_task) {
                ret += ` with task "${c.own_task}"`;
            } else {
                ret += ' with any task';
            }

            if (c.negated) {
                ret += ' they cannot be scheduled with';

                if (c.adjacent_person) {
                    ret += ` person "${c.adjacent_person}"`;
                } else {
                    ret += ' any person';
                }

                if (c.adjacent_task) {
                    ret += ` doing task "${c.adjacent_task}"`;
                } else {
                    ret += ' doing any task';
                }
            } else {
                ret += ' they must be scheduled with';

                if (c.adjacent_person) {
                    ret += ` person "${c.adjacent_person}"`;
                } else {
                    ret += ' any person';
                }

                if (c.adjacent_task) {
                    ret += ` task "${c.adjacent_task}"`;
                } else {
                    ret += ' doing any task';
                }
            }

            return ret;
        } catch (e) {
            return this.sanitizer.bypassSecurityTrustHtml(
                `<span style="color:red;">Error: ${e}</span>`,
            );
        }
    }

    save() {
        this.scheduleConstraintsService.save();
        this._snackBar.open('Saved!', 'OK', { duration: 2000 });
    }
}
