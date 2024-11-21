import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AlgorithmSettings, AlgorithmStatus, RunAlgorithmService } from '../run-algorithm.service';
import { SolutionsService, SolutionStatus } from '../solutions.service';

@Component({
    selector: 'app-run-algorithm',
    templateUrl: './run-algorithm.component.html',
    styleUrls: ['./run-algorithm.component.less'],
    standalone: false
})
export class RunAlgorithmComponent implements OnInit {
    expertMode = false;

    solutions$: Observable<SolutionStatus[]>;

    status: AlgorithmStatus;

    settings: AlgorithmSettings = {
        alpha: 0.999,
        start_temp: 10000,
        k: 1000,
        num_offsprings: 1000,
        initial_state: null,
    };

    constructor(
        private runAlgorithmService: RunAlgorithmService,
        private solutionsService: SolutionsService,
    ) {}

    ngOnInit(): void {
        this.solutions$ = this.solutionsService.solutions$;
    }

    run() {
        this.runAlgorithmService.run(this.settings).subscribe(d => (this.status = d));
    }
}
