import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HasWarnings, Warnings } from './warning-interface';

@Injectable({
    providedIn: 'root',
})
export class TasksService implements HasWarnings {
    public readonly tasks$: BehaviorSubject<string[]> = new BehaviorSubject([]);

    constructor(private http: HttpClient) {
        this.getTasks().subscribe(t => this.tasks$.next(t));
    }

    public getTasks(): Observable<string[]> {
        return this.http.get<string[]>(`${environment.api}/tasks`);
    }

    public save() {
        return this.http
            .post<string[]>(`${environment.api}/tasks`, this.tasks$.value)
            .subscribe(d => this.tasks$.next(d));
    }

    public getWarnings(): Observable<Warnings[]> {
        return this.tasks$.pipe(
            map(d => {
                if (d.length === 0) {
                    return [
                        {
                            type: 'task',
                            severity: 'error',
                            msg: 'There must be at least one task.',
                        },
                    ];
                }
                return [];
            }),
        );
    }

    public isValid(): Observable<boolean> {
        return this.tasks$.pipe(map(d => d.length > 0));
    }
}
