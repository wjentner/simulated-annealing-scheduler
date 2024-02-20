import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { combineLatest } from 'rxjs/internal/observable/combineLatest';
import { environment } from 'src/environments/environment';
import {
    FulfilledTimeConstraint,
    ScheduleConstraintsService,
    TimeConstraint,
} from './schedule-constraints.service';
import { TasksService } from './tasks.service';
import { DateTime } from 'luxon';

export interface Schedule {
    // date --> task --> person
    [key: string]: { [key: string]: string };
}

export interface Penalty {
    desc: string;
    penalty: number;
}

export interface SolutionStatus {
    name: string;
    status: string;
    fitness?: number;
    penalties?: Penalty[];
    schedule?: Schedule;
    error_msg?: string;
    fitness_history: { fitness: number; time: string }[];
    // date --> task --> desired date
    dd?: { [key: string]: { [key: string]: boolean } };
    desiredDates?: TimeConstraint[];
    // date --> desired date
    desiredDatesOfDay?: { [key: string]: FulfilledTimeConstraint[] };
    undesiredDatesOfDay?: { [key: string]: FulfilledTimeConstraint[] };
}

export interface Statistics {
    persMap: Map<string, Map<string, number>>;
    totalDDs: Map<string, number>;
    hitDDs: Map<string, number>;
    persDesiredDatesMap: Map<string, FulfilledTimeConstraint[]>;
    persUnDesiredDatesMap: Map<string, FulfilledTimeConstraint[]>;
}

@Injectable({
    providedIn: 'root',
})
export class SolutionsService {
    public readonly solutions$: BehaviorSubject<SolutionStatus[]> = new BehaviorSubject([]);

    constructor(
        private http: HttpClient,
        private tasksService: TasksService,
        private scheduleConstraintsService: ScheduleConstraintsService,
    ) {
        this.getSolutions();
    }

    isDesiredDate(dds: TimeConstraint[], date: string, person: string, task?: string): boolean {
        for (const dd of dds) {
            if (dd.min_date === date && dd.person === person) {
                if (task && task === dd.task) {
                    return true;
                }
                if (task === null || task === undefined) {
                    return true;
                }
            }
        }

        return false;
    }

    getDesiredDateConstraints(
        dds: TimeConstraint[],
        date: string,
        sol: SolutionStatus,
    ): FulfilledTimeConstraint[] {
        const filtered: FulfilledTimeConstraint[] = [];
        for (const dd of dds) {
            if (dd.min_date === date && dd.max_date === date && dd.negated === false) {
                let fulfilled = false;
                for (const v of Object.values(sol.schedule[date])) {
                    if (v === dd.person) {
                        fulfilled = true;
                        break;
                    }
                }
                filtered.push({
                    ...dd,
                    is_fulfilled: fulfilled,
                });
            }
        }
        filtered.sort((a, b) => {
            const av = a.is_fulfilled ? 1 : 0;
            const bv = b.is_fulfilled ? 1 : 0;
            return bv - av;
        });
        return filtered;
    }

    getSolutions() {
        combineLatest([
            this.http.get<SolutionStatus[]>(`${environment.api}/solutions`),
            this.scheduleConstraintsService.getDesiredDates(),
            this.scheduleConstraintsService.getUnDesiredDates(),
        ])
            .pipe(
                map(d1 => {
                    console.log('test', d1);
                    for (const d of d1[0]) {
                        d.desiredDates = d1[1];
                        d.dd = {};
                        if (d.schedule) {
                            d.desiredDatesOfDay = {};
                            d.undesiredDatesOfDay = {};
                            for (const date of Object.keys(d.schedule)) {
                                const dateTime = DateTime.fromISO(date);
                                d.undesiredDatesOfDay[date] = d1[2]
                                    .filter(tc => {
                                        const from = DateTime.fromISO(tc.min_date);
                                        const to = DateTime.fromISO(tc.max_date);
                                        return (
                                            tc.negated === true &&
                                            from <= dateTime &&
                                            dateTime <= to
                                        );
                                    })
                                    .map(tc => {
                                        let fulfilled = true;

                                        for (const task of Object.keys(d.schedule[date])) {
                                            const person = d.schedule[date][task];

                                            if (
                                                tc.person === person &&
                                                (tc.task === null ||
                                                    tc.task === undefined ||
                                                    tc.task === task)
                                            ) {
                                                fulfilled = false;
                                                break;
                                            }
                                        }

                                        return { ...tc, is_fulfilled: fulfilled };
                                    });

                                d.desiredDatesOfDay[date] = this.getDesiredDateConstraints(
                                    d1[1],
                                    date,
                                    d,
                                );
                                d.dd[date] = {};
                                for (const task of Object.keys(d.schedule[date])) {
                                    const person = d.schedule[date][task];
                                    d.dd[date][task] = this.isDesiredDate(d1[1], date, person);
                                }
                            }
                        }
                    }
                    return d1[0];
                }),
            )
            .subscribe(sol => {
                console.log('solution after', sol);
                this.solutions$.next(sol);
            });
    }

    getSolution(name: string): Observable<SolutionStatus> {
        return this.http.get<SolutionStatus>(`${environment.api}/solutions/${name}`);
    }

    calcPersonStats(sol: SolutionStatus): Statistics {
        const persMap = new Map<string, Map<string, number>>();
        const totalDDs = new Map<string, number>();
        const hitDDs = new Map<string, number>();
        const persDesiredDatesMap = new Map<string, FulfilledTimeConstraint[]>();
        const persUnDesiredDatesMap = new Map<string, FulfilledTimeConstraint[]>();

        if (!sol || !sol.schedule) {
            return null;
        }

        if (sol?.desiredDates) {
            for (const dd of sol.desiredDates) {
                totalDDs.set(dd.person, (totalDDs.get(dd.person) || 0) + 1);
            }
        }

        for (const [date, taskMap] of Object.entries(sol.schedule)) {
            for (const [task, person] of Object.entries(taskMap)) {
                if (!persMap.has(person)) {
                    persMap.set(person, new Map<string, number>());
                }

                persMap.get(person).set(task, (persMap.get(person).get(task) || 0) + 1);
                persMap.get(person).set('total', (persMap.get(person).get('total') || 0) + 1);

                if (this.isDesiredDate(sol.desiredDates, date, person)) {
                    hitDDs.set(person, (hitDDs.get(person) || 0) + 1);
                }
            }
        }

        for (const byDay of Object.values(sol.desiredDatesOfDay)) {
            for (const ftc of byDay) {
                if (!persDesiredDatesMap.has(ftc.person)) {
                    persDesiredDatesMap.set(ftc.person, []);
                }
                persDesiredDatesMap.get(ftc.person).push(ftc);
            }
        }

        for (const ftc of persDesiredDatesMap.values()) {
            ftc.sort((a, b) => {
                const av = a.is_fulfilled ? 1 : 0;
                const bv = b.is_fulfilled ? 1 : 0;
                return bv - av;
            });
        }

        for (const byDay of Object.values(sol.undesiredDatesOfDay)) {
            for (const ftc of byDay) {
                if (!ftc.is_fulfilled) {
                    if (!persUnDesiredDatesMap.has(ftc.person)) {
                        persUnDesiredDatesMap.set(ftc.person, []);
                    }
                    persUnDesiredDatesMap.get(ftc.person).push(ftc);
                }
            }
        }

        return { persMap, totalDDs, hitDDs, persDesiredDatesMap, persUnDesiredDatesMap };
    }

    getMax(persMap: Map<string, Map<string, number>>, task: string): number | null {
        if (!persMap) {
            return null;
        }

        let max = 0;

        for (const taskMap of persMap.values()) {
            if (taskMap.get(task) > max) {
                max = taskMap.get(task);
            }
        }

        return max;
    }
}
