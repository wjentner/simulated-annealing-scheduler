import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SolutionsService, SolutionStatus, Statistics } from '../solutions.service';
import { TasksService } from '../tasks.service';
import { FulfilledTimeConstraint } from '../schedule-constraints.service';

@Component({
    selector: 'app-solutions',
    templateUrl: './solutions.component.html',
    styleUrls: ['./solutions.component.less'],
})
export class SolutionsComponent implements OnInit {
    solutions$: Observable<SolutionStatus[]>;
    tasks$: Observable<string[]>;

    selectedSolution: SolutionStatus;

    personStats: Statistics;

    downloadUrlPrefix = `${environment.api}/solutions/`;

    constructor(
        private solutionsService: SolutionsService,
        private tasksService: TasksService,
    ) {}

    ngOnInit(): void {
        this.solutions$ = this.solutionsService.solutions$;
        this.tasks$ = this.tasksService.tasks$;
        this.solutions$.subscribe(d => this.updateSol(d[d.length - 1]));

        // update all
        this.solutionsService.getSolutions();
    }

    updateSol(sol: SolutionStatus) {
        this.selectedSolution = sol;
        this.personStats = this.solutionsService.calcPersonStats(this.selectedSolution);
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
}
