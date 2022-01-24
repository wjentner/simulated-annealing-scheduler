import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { HasWarnings, Warnings } from './warning-interface';

export interface SelectablePerson {
    id: string;
    name: string;
}

@Injectable({
    providedIn: 'root',
})
export class SelectablePersonsService implements HasWarnings {
    public readonly selectablePersons$: BehaviorSubject<SelectablePerson[]> = new BehaviorSubject(
        [],
    );

    constructor(private http: HttpClient) {
        this.http
            .get<SelectablePerson[]>(`${environment.api}/persons`)
            .pipe(tap(d => console.log('persons', d)))
            .subscribe(d => this.selectablePersons$.next(d));
    }

    save() {
        this.http
            .post<SelectablePerson[]>(`${environment.api}/persons`, this.selectablePersons$.value)
            .subscribe(d => this.selectablePersons$.next(d));
    }

    vereinsfliegerImport(file: File) {
        const formData = new FormData();

        formData.append('file', file);
        this.http
            .post<SelectablePerson[]>(`${environment.api}/persons/importcsv`, formData)
            .subscribe(d => this.selectablePersons$.next(d));
    }

    public getWarnings(): Observable<Warnings[]> {
        return this.selectablePersons$.pipe(
            map(d => {
                if (d.length === 0) {
                    return [
                        {
                            type: 'selectable-person',
                            severity: 'error',
                            msg: 'There must be at least one person in the pool.',
                        },
                    ];
                }

                if (d.length === 1) {
                    return [
                        {
                            type: 'selectable-person',
                            severity: 'warning',
                            msg: 'There should be more than one person in the pool.',
                        },
                    ];
                }

                return [];
            }),
        );
    }

    public isValid(): Observable<boolean> {
        return this.selectablePersons$.pipe(map(d => d.length > 0));
    }
}
