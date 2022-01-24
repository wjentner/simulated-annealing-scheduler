import { Observable } from 'rxjs';

export interface Warnings {
    severity: 'warning' | 'error';
    type:
        | 'task'
        | 'selectable-person'
        | 'date'
        | 'min-max-constraint'
        | 'time-constraint'
        | 'buddy-constraint'
        | 'misc-constraint'
        | 'algorithm-settings'
        | 'statistics';
    msg: string;
}

export interface HasWarnings {
    getWarnings(): Observable<Warnings[]>;

    isValid(): Observable<boolean>;
}
