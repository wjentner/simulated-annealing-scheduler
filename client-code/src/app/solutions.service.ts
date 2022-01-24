import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TasksService } from './tasks.service';

export interface Schedule {
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
}

@Injectable({
    providedIn: 'root',
})
export class SolutionsService {
    public readonly solutions$: BehaviorSubject<SolutionStatus[]> = new BehaviorSubject([]);

    constructor(private http: HttpClient, private tasksService: TasksService) {
        this.getSolutions();
    }

    getSolutions() {
        this.http.get<SolutionStatus[]>(`${environment.api}/solutions`).subscribe(sol => {
            this.solutions$.next(sol);
        });
    }

    getSolution(name: string): Observable<SolutionStatus> {
        return this.http.get<SolutionStatus>(`${environment.api}/solutions/${name}`);
    }

    calcPersonStats(sol: SolutionStatus): Map<string, Map<string, number>> {
        const persMap = new Map<string, Map<string, number>>();

        if (!sol || !sol.schedule) {
            return null;
        }

        for (const [_, taskMap] of Object.entries(sol.schedule)) {
            for (const [task, person] of Object.entries(taskMap)) {
                if (!persMap.has(person)) {
                    persMap.set(person, new Map<string, number>());
                }

                persMap.get(person).set(task, (persMap.get(person).get(task) || 0) + 1);
                persMap.get(person).set('total', (persMap.get(person).get('total') || 0) + 1);
            }
        }

        return persMap;
    }

    getMax(persMap: Map<string, Map<string, number>>, task: string): number | null {
        if (!persMap) {
            return null;
        }

        let max = 0;

        for (const [person, taskMap] of persMap.entries()) {
            if (taskMap.get(task) > max) {
                max = taskMap.get(task);
            }
        }

        return max;
    }
}
