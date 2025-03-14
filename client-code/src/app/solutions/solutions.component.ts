import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SolutionsService, SolutionStatus, Statistics } from '../solutions.service';
import { TasksService } from '../tasks.service';
import { FulfilledTimeConstraint } from '../schedule-constraints.service';
import { DateTime } from 'luxon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-solutions',
    templateUrl: './solutions.component.html',
    styleUrls: ['./solutions.component.less'],
    standalone: false,
})
export class SolutionsComponent implements OnInit {
    solutions$: Observable<SolutionStatus[]>;
    tasks$: Observable<string[]>;

    selectedSolution: SolutionStatus;

    personStats: Statistics;

    downloadUrlPrefix = `${environment.api}/solutions/`;

    chart: any;

    chartOptions = {
        theme: 'light2',
        animationEnabled: true,
        zoomEnabled: true,
        title: {
            text: 'Fitness History',
        },
        // axisY: {
        //     labelFormatter: (e: any) => {
        //         const suffixes = ['', 'K', 'M', 'B', 'T'];

        //         let order = Math.max(Math.floor(Math.log(e.value) / Math.log(1000)), 0);
        //         if (order > suffixes.length - 1) order = suffixes.length - 1;

        //         const suffix = suffixes[order];
        //         return '$' + e.value / Math.pow(1000, order) + suffix;
        //     },
        // },
        data: [
            {
                type: 'line',
                dataPoints: [
                    { x: new Date(1980, 0, 1), y: 2500582120 },
                    { x: new Date(1981, 0, 1), y: 2318922620 },
                ],
            },
        ],
    };

    constructor(
        private solutionsService: SolutionsService,
        private tasksService: TasksService,
        private _snackBar: MatSnackBar,
    ) {}

    ngOnInit(): void {
        this.solutions$ = this.solutionsService.solutions$;
        this.tasks$ = this.tasksService.tasks$;
        this.solutions$.subscribe(d => this.updateSol(d[d.length - 1]));

        // update all
        this.solutionsService.getSolutions();
    }

    getChartInstance(chart: object) {
        this.chart = chart;
    }

    updateSol(sol: SolutionStatus) {
        this.selectedSolution = sol;
        this.personStats = this.solutionsService.calcPersonStats(this.selectedSolution);
        if (this?.selectedSolution?.fitness_history) {
            this.chartOptions.data[0].dataPoints = this.selectedSolution.fitness_history.map(d => {
                return { x: DateTime.fromISO(d.time).toJSDate(), y: d.fitness };
            });
            this.chartOptions = { ...this.chartOptions };
            if (this.chart) {
                this.chart.render();
            }
        }
    }

    deleteSolution() {
        this.solutionsService.deleteSolution(this.selectedSolution.name).subscribe(() => {
            this.solutionsService.getSolutions();
            this._snackBar.open('Solution deleted!', 'OK', { duration: 2000 });
        });
    }

    reloadSolution() {
        this.solutionsService
            .getSolution(this.selectedSolution.name)
            .subscribe(d => this.updateSol(d));
    }

    getMaxForTask(task: string): number {
        return this.solutionsService.getMax(this.personStats.persMap, task);
    }

    getUndesired(
        tcs: FulfilledTimeConstraint[],
        person: string,
        task?: string,
    ): FulfilledTimeConstraint {
        return tcs.find(
            tc =>
                tc.is_fulfilled === false &&
                tc.person === person &&
                (tc.task === null || tc.task === undefined || tc.task === task),
        );
    }

    getUndesiredText(tcs: FulfilledTimeConstraint[], person: string, task?: string): string {
        const tc = this.getUndesired(tcs, person, task);
        if (!tc) {
            return '';
        }
        return `Does not want to be scheduled from ${tc.min_date} to ${tc.max_date}`;
    }

    getFulfilledDesiredDateCount(sol: SolutionStatus): number {
        let sum = 0;
        for (const perDay of Object.values(sol.desiredDatesOfDay)) {
            for (const tc of perDay) {
                if (tc.is_fulfilled) {
                    sum += 1;
                }
            }
        }
        return sum;
    }

    getUnfulfilledDesiredDateCount(sol: SolutionStatus): number {
        let sum = 0;
        for (const perDay of Object.values(sol.desiredDatesOfDay)) {
            for (const tc of perDay) {
                if (!tc.is_fulfilled) {
                    sum += 1;
                }
            }
        }
        return sum;
    }

    getUnfulfilledUndesiredDateCount(sol: SolutionStatus): number {
        let sum = 0;
        for (const perDay of Object.values(sol.undesiredDatesOfDay)) {
            for (const tc of perDay) {
                if (!tc.is_fulfilled) {
                    sum += 1;
                }
            }
        }
        return sum;
    }
}
