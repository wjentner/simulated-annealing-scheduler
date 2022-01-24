import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface AlgorithmSettings {
    initial_state?: string;
    start_temp: number;
    alpha: number;
    k: number;
    num_offsprings: number;
}

export interface AlgorithmStatus {
    solution: string;
    status: string;
}

@Injectable({
    providedIn: 'root',
})
export class RunAlgorithmService {
    constructor(private http: HttpClient) {}

    public run(settings: AlgorithmSettings): Observable<AlgorithmStatus> {
        return this.http.post<AlgorithmStatus>(`${environment.api}/optimize`, settings);
    }
}
