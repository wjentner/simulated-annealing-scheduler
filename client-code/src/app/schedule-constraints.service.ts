import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DateTime } from 'luxon';
import { BehaviorSubject, filter, map, mergeMap, Observable, take, toArray } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HasWarnings, Warnings } from './warning-interface';

export interface TimeConstraint {
    negated: boolean;
    person: string;
    task?: string;
    min_date: string;
    max_date: string;
    penalty: number;
}

export interface FulfilledTimeConstraint extends TimeConstraint {
    is_fulfilled: boolean;
}

export interface BuddyConstraint {
    negated: boolean;
    person_a: string;
    person_b: string;
    penalty: number;
}

export interface MinMaxConstraint {
    min: number;
    max: number;
    min_penalty: number;
    max_penalty: number;
}

export interface AdjacentTaskConstraint {
    negated: boolean;
    person: string;
    own_task?: string;
    adjacent_task?: string;
    adjacent_person?: string;
    penalty: number;
}

export interface ScheduleConstraints {
    min_max_constraints: { [key: string]: { [key: string]: MinMaxConstraint } };

    min_max_constraints_general?: { [key: string]: MinMaxConstraint };

    dates_and_tasks: { [key: string]: { [key: string]: boolean } };

    time_constraints: TimeConstraint[];

    buddy_constraints: BuddyConstraint[];

    adjacent_task_constraints?: AdjacentTaskConstraint[];

    empty_task_penalty: number;

    default_min_max_constraint_penalty: number;

    not_uniform_penalty_factor: number;

    not_uniform_penalty_min_days: number;

    sat_sun_inequality_factor: number;

    task_variance_penalty_factor: number;
}

@Injectable({
    providedIn: 'root',
})
export class ScheduleConstraintsService implements HasWarnings {
    public readonly constraints$: BehaviorSubject<ScheduleConstraints> = new BehaviorSubject(null);

    constructor(private http: HttpClient) {
        this.http.get<ScheduleConstraints>(`${environment.api}/constraints`).subscribe(d => {
            this.constraints$.next(d);
        });
    }

    getDesiredDates(): Observable<TimeConstraint[]> {
        return this.http.get<ScheduleConstraints>(`${environment.api}/constraints`).pipe(
            mergeMap(d => d?.time_constraints || []),
            filter(d => d && d.negated === false && d.min_date === d.max_date),
            toArray(),
        );
    }

    getUnDesiredDates(): Observable<TimeConstraint[]> {
        return this.http.get<ScheduleConstraints>(`${environment.api}/constraints`).pipe(
            mergeMap(d => d?.time_constraints || []),
            filter(d => d && d.negated === true),
            toArray(),
        );
    }

    getWarnings(): Observable<Warnings[]> {
        return this.constraints$.pipe(
            map(d => {
                const ws: Warnings[] = [];
                if (!d) {
                    return [];
                }

                if (
                    d.dates_and_tasks === null ||
                    d.dates_and_tasks === undefined ||
                    Object.entries(d.dates_and_tasks).length === 0
                ) {
                    ws.push({
                        severity: 'error',
                        type: 'date',
                        msg: 'There must be at minimum one date with tasks configured!',
                    });
                }

                if (!d.min_max_constraints || Object.entries(d.min_max_constraints).length === 0) {
                    ws.push({
                        severity: 'warning',
                        type: 'min-max-constraint',
                        msg: 'There is no min-max-constraint defined.',
                    });
                }

                if (!d.time_constraints || d.time_constraints.length === 0) {
                    ws.push({
                        severity: 'warning',
                        type: 'time-constraint',
                        msg: 'There is no time-constraint defined.',
                    });
                }

                if (d.time_constraints) {
                    d.time_constraints.forEach(t => {
                        const min = DateTime.fromISO(t.min_date);
                        const max = DateTime.fromISO(t.max_date);
                        if (max < min) {
                            ws.push({
                                severity: 'error',
                                type: 'time-constraint',
                                msg: `A time constraint has the from date (${t.min_date}) after the end date (${t.max_date})`,
                            });
                        }

                        if (t.penalty < 0) {
                            ws.push({
                                severity: 'error',
                                type: 'time-constraint',
                                msg: `A time constraint has a negative penalty`,
                            });
                        }
                    });
                }

                return ws;
            }),
        );
    }

    isValid(): Observable<boolean> {
        throw new Error('Method not implemented.');
    }

    save() {
        // sanitize constraints
        this.constraints$
            .pipe(
                map(d => {
                    for (const tc of d.time_constraints) {
                        if ((tc.min_date as unknown) instanceof DateTime) {
                            tc.min_date = (tc.min_date as unknown as DateTime).toISODate();
                        } else {
                            tc.min_date = DateTime.fromISO(tc.min_date).toISODate();
                        }

                        if ((tc.max_date as unknown) instanceof DateTime) {
                            tc.max_date = (tc.max_date as unknown as DateTime).toISODate();
                        } else {
                            tc.max_date = DateTime.fromISO(tc.max_date).toISODate();
                        }
                    }
                    return d;
                }),
                take(1),
            )
            .subscribe(scheduleConstraints => {
                this.http
                    .post<ScheduleConstraints>(
                        `${environment.api}/constraints`,
                        scheduleConstraints,
                    )
                    .subscribe(() => this.constraints$.next(scheduleConstraints));
            });
    }
}
