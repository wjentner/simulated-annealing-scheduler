import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { combineLatest } from 'rxjs/internal/observable/combineLatest';
import { environment } from 'src/environments/environment';
import { ScheduleConstraintsService, TimeConstraint } from './schedule-constraints.service';
import { TasksService } from './tasks.service';

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
    // date --> task --> desired date
    dd?: { [key: string]: { [key: string]: boolean } };
    desiredDates?: TimeConstraint[];
}

export interface Statistics {
    persMap: Map<string, Map<string, number>>;
    totalDDs: Map<string, number>;
    hitDDs: Map<string, number>;
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

    getSolutions() {
        combineLatest([
            this.http.get<SolutionStatus[]>(`${environment.api}/solutions`),
            this.scheduleConstraintsService.getDesiredDates(),
        ])
            .pipe(
                map(d1 => {
                    console.log('test', d1);
                    for (const d of d1[0]) {
                        d.desiredDates = d1[1];
                        d.dd = {};
                        if (d.schedule) {
                            for (const date of Object.keys(d.schedule)) {
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

        return { persMap, totalDDs, hitDDs };
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
