import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    MinMaxConstraint,
    ScheduleConstraints,
    ScheduleConstraintsService,
    TimeConstraint,
} from './schedule-constraints.service';
import { forkJoin, map, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface InternImportRequest {
    year: number;
    user: string;
    password: string;
}

export interface InternImportConstraints {
    min_max_constraints_general?: { [key: string]: MinMaxConstraint };

    time_constraints: TimeConstraint[];
}

@Injectable({
    providedIn: 'root',
})
export class InternImportService {
    constructor(
        private http: HttpClient,
        private scheduleConstraintsService: ScheduleConstraintsService,
    ) {}

    getInternData(request: InternImportRequest): Observable<InternImportConstraints> {
        return this.http.post<InternImportConstraints>(environment.internEndpoint, request);
    }

    mergeInternData(
        request: InternImportRequest,
        removeOldTimeConstraints: boolean,
    ): Observable<ScheduleConstraints> {
        const sc: ScheduleConstraints = JSON.parse(
            JSON.stringify(this.scheduleConstraintsService.constraints$.value),
        );
        return this.getInternData(request).pipe(
            map(d => {
                const ic = d;

                if (removeOldTimeConstraints) {
                    sc.time_constraints = sc.time_constraints.filter(c => c.penalty !== 1000);
                }

                sc.time_constraints = [...sc.time_constraints, ...ic.time_constraints];

                for (const [person, c] of Object.entries(ic.min_max_constraints_general)) {
                    sc.min_max_constraints_general[person] = c;
                }

                return sc;
            }),
        );
    }
}
