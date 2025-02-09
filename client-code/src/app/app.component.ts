import { Component } from '@angular/core';
import { from, map, mergeMap, Observable, take, toArray } from 'rxjs';
import { ScheduleConstraintsService } from './schedule-constraints.service';
import { SelectablePersonsService } from './selectable-persons.service';
import { StatisticsService } from './statistics.service';
import { TasksService } from './tasks.service';
import { HasWarnings } from './warning-interface';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.less'],
    standalone: false,
})
export class AppComponent {
    title = 'sa-scheduler-client';

    public constructor(
        private tasksService: TasksService,
        private selectablePersonsService: SelectablePersonsService,
        private scheduleConstraintsService: ScheduleConstraintsService,
        private statisticsService: StatisticsService,
    ) {}

    tasksValid(): Observable<boolean> {
        return this.tasksService.isValid();
    }

    selectablePersonsValid(): Observable<boolean> {
        return this.selectablePersonsService.isValid();
    }

    getStatus(type: string): Observable<'ok' | 'warning' | 'error'> {
        switch (type) {
            case 'tasks':
                return this.getStatusOfService(this.tasksService);

            case 'selectable-persons':
                return this.getStatusOfService(this.selectablePersonsService);

            case 'dates':
                return this.getStatusOfService(this.scheduleConstraintsService, 'date');

            case 'min-max-constraints':
                return this.getStatusOfService(
                    this.scheduleConstraintsService,
                    'min-max-constraint',
                );

            case 'timeconstraints':
                return this.getStatusOfService(this.scheduleConstraintsService, 'time-constraint');

            case 'adjacent-task-constraints':
                return this.getStatusOfService(
                    this.scheduleConstraintsService,
                    'adjacent-task-constraint',
                );

            case 'statistics':
                return this.getStatusOfService(this.statisticsService);

            default:
                throw new Error(`Type ${type} not known`);
        }
    }

    getStatusOfService(
        service: HasWarnings,
        type?: string,
    ): Observable<'ok' | 'warning' | 'error'> {
        return service.getWarnings().pipe(
            map(d => {
                if (type) {
                    d = d.filter(w => w.type === type);
                }
                if (d.filter(w => w.severity === 'error').length > 0) {
                    return 'error';
                }
                if (d.length > 0) {
                    return 'warning';
                }
                return 'ok';
            }),
        );
    }

    haveErrors(services: string[]): Observable<boolean> {
        return from(services).pipe(
            mergeMap(d => {
                const t = this.getStatus(d).pipe(map(e => e === 'error'));
                return t;
            }),
            take(services.length),
            toArray(),
            map(d => d.reduce((agg, val) => agg || val)),
        );
    }
}
