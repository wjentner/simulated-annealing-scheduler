import { Injectable } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ScheduleConstraints, ScheduleConstraintsService } from './schedule-constraints.service';
import { TasksService } from './tasks.service';
import { HasWarnings, Warnings } from './warning-interface';

@Injectable({
    providedIn: 'root',
})
export class StatisticsService implements HasWarnings {
    constructor(
        private scheduleConstraintsService: ScheduleConstraintsService,
        private tasksService: TasksService,
    ) {}

    getWarnings(): Observable<Warnings[]> {
        return this.scheduleConstraintsService.constraints$.pipe(
            map(c => {
                let ws: Warnings[] = [];

                const tasks = this.tasksService.tasks$.value;

                tasks.forEach(t => {
                    ws = ws.concat(this.getWarningForTask(t, c));
                });

                return ws;
            }),
        );
    }

    isValid(): Observable<boolean> {
        throw new Error('Method not implemented.');
    }

    numDate(taskId: string): Observable<number> {
        return this.scheduleConstraintsService.constraints$.pipe(
            map(d => this.getNumDates(taskId, d)),
        );
    }

    minPeople(taskId: string): Observable<number> {
        return this.scheduleConstraintsService.constraints$.pipe(
            map(d => this.getMinPeople(taskId, d)),
        );
    }

    maxPeople(taskId: string): Observable<number> {
        return this.scheduleConstraintsService.constraints$.pipe(
            map(d => this.getMaxPeople(taskId, d)),
        );
    }

    warnings(taskId: string): Observable<Warnings[]> {
        return this.scheduleConstraintsService.constraints$.pipe(
            map(d => this.getWarningForTask(taskId, d)),
        );
    }

    avgPeople(taskId: string): Observable<number> {
        return combineLatest([this.numDate(taskId), this.minPeople(taskId)]).pipe(
            map(([tasks, ppl]) => {
                if (tasks === 0 || ppl === 0) {
                    return 0;
                }
                return tasks / ppl;
            }),
        );
    }

    private getNumDates(task: string, constraints: ScheduleConstraints): number {
        if (!constraints) {
            return 0;
        }
        let sum = 0;
        for (const date in constraints.dates_and_tasks) {
            if (!Object.prototype.hasOwnProperty.call(constraints.dates_and_tasks, date)) {
                continue;
            }
            for (const pTask in constraints.dates_and_tasks[date]) {
                //console.log(ctrl.data.dates[iDate]+": "+pTask);
                if (
                    Object.prototype.hasOwnProperty.call(
                        constraints.dates_and_tasks[date],
                        pTask,
                    ) &&
                    pTask === task &&
                    constraints.dates_and_tasks[date][pTask] === true
                ) {
                    sum++;
                }
            }
        }
        return sum;
    }

    private getMinPeople(task: string, constraints: ScheduleConstraints): number {
        if (!constraints) {
            return 0;
        }
        let sum = 0;
        for (const [, taskMap] of Object.entries(constraints.min_max_constraints)) {
            for (const [pTask, constraint] of Object.entries(taskMap)) {
                if (pTask === task) {
                    sum += constraint.min;
                }
            }
        }
        return sum;
    }

    private getMaxPeople(task: string, constraints: ScheduleConstraints): number {
        if (!constraints) {
            return 0;
        }
        let sum = 0;
        for (const [, taskMap] of Object.entries(constraints.min_max_constraints)) {
            for (const [pTask, constraint] of Object.entries(taskMap)) {
                if (pTask === task) {
                    sum += constraint.max;
                }
            }
        }
        return sum;
    }

    private getWarningForTask(task: string, constraints: ScheduleConstraints): Warnings[] {
        const ws: Warnings[] = [];

        const n = this.getNumDates(task, constraints);

        const min = this.getMinPeople(task, constraints);
        const max = this.getMaxPeople(task, constraints);

        if (n < min) {
            ws.push({
                severity: 'warning',
                type: 'statistics',
                msg: `There are only ${n} tasks but a minimum of ${min} persons are available. (Decrease min-constraint)`,
            });
        }

        if (n > max) {
            ws.push({
                severity: 'warning',
                type: 'statistics',
                msg: `There are ${n} tasks needed but only a maximum of ${max} persons are available. (Increase max-constraint)`,
            });
        }

        return ws;
    }
}
