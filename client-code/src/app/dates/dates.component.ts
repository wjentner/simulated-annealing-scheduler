import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { getHolidays, Holiday, isHoliday } from 'feiertagejs';
import { DateTime } from 'luxon';
import { map, Observable } from 'rxjs';
import { ScheduleConstraints, ScheduleConstraintsService } from '../schedule-constraints.service';
import { StatisticsService } from '../statistics.service';
import { TasksService } from '../tasks.service';

export interface DateItem {
    date: string;
    holiday: boolean;
    [key: string]: string | boolean;
}

@Component({
    selector: 'app-dates',
    templateUrl: './dates.component.html',
    styleUrls: ['./dates.component.less'],
})
export class DatesComponent implements OnInit {
    constraints$: Observable<ScheduleConstraints>;
    dates$: Observable<DateItem[]>;
    tasks$: Observable<string[]>;

    createFromDate: DateTime = DateTime.now();
    createToDate: DateTime = DateTime.now();

    holidaysMap: Map<string, Holiday> = new Map();

    dateAdd: DateTime = DateTime.now();

    constructor(
        private scheduleConstraintsService: ScheduleConstraintsService,
        private statisticsService: StatisticsService,
        private tasksService: TasksService,
        private _snackBar: MatSnackBar,
    ) {}

    ngOnInit(): void {
        this.constraints$ = this.scheduleConstraintsService.constraints$;
        this.tasks$ = this.tasksService.tasks$;
        this.dates$ = this.scheduleConstraintsService.constraints$.pipe(
            map(d => d.dates_and_tasks),
            map(d => {
                const dates: DateItem[] = [];
                for (const [date, taskMap] of Object.entries(d)) {
                    const d1: DateItem = { date, holiday: taskMap.holiday || false };
                    for (const [task, bool] of Object.entries(taskMap)) {
                        if (task === 'holiday') {
                            continue;
                        }

                        d1[task] = bool;
                    }
                }
                return dates;
            }),
        );
    }

    addDate(date: DateTime) {
        const d = this.scheduleConstraintsService.constraints$.value;
        d.dates_and_tasks[date.toISODate()] = {};
        this.scheduleConstraintsService.constraints$.next(d);
        this.save();
    }

    createDates() {
        const d = this.scheduleConstraintsService.constraints$.value;
        let mCur = this.createFromDate;
        const mTo = this.createToDate;
        while (mCur <= mTo) {
            if (mCur.weekday === 6 || mCur.weekday === 7 || isHoliday(mCur.toJSDate(), 'BW')) {
                //saturday
                const isAHoliday = isHoliday(mCur.toJSDate(), 'BW');
                const isSunday = mCur.weekday === 7;
                const iso = mCur.toISODate();
                d.dates_and_tasks[iso] = {};
                d.dates_and_tasks[iso].holiday = isAHoliday;
                for (const t of this.tasksService.tasks$.value) {
                    d.dates_and_tasks[iso][t] = true;
                }
            }
            mCur = mCur.plus({ days: 1 });
        }

        this.scheduleConstraintsService.constraints$.next(d);
        this.save();
    }

    deleteAllDates() {
        this.scheduleConstraintsService.constraints$.next({
            ...this.scheduleConstraintsService.constraints$.value,
            dates_and_tasks: {},
        });
        this.save();
    }

    numDate(task: string): Observable<number> {
        return this.statisticsService.numDate(task);
    }

    showHoliday(isoDate: string): string {
        const d = DateTime.fromISO(isoDate);
        if (!isHoliday(d.toJSDate(), 'BW')) {
            return '';
        } else {
            if (!this.holidaysMap.has(isoDate)) {
                const year = d.year + '';
                this.getHolidays(year);
            }
            return this.holidaysMap.get(isoDate).translate(undefined);
        }
    }

    getHolidays(year: string) {
        const holidays = getHolidays(year, 'BW');

        for (const h of holidays) {
            const key = DateTime.fromJSDate(h.date).toISODate();
            this.holidaysMap.set(key, h);
        }
    }

    removeDate(isoDate: string) {
        const d = this.scheduleConstraintsService.constraints$.value;
        delete d.dates_and_tasks[isoDate];
        this.scheduleConstraintsService.constraints$.next(d);
        this.save();
    }

    save() {
        this.scheduleConstraintsService.save();
        this._snackBar.open('Saved!', 'OK', { duration: 2000 });
    }
}
