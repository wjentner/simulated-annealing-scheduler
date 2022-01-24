import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { StatisticsService } from '../statistics.service';
import { TasksService } from '../tasks.service';

@Component({
    selector: 'app-statistics',
    templateUrl: './statistics.component.html',
    styleUrls: ['./statistics.component.less'],
})
export class StatisticsComponent implements OnInit {
    tasks$: Observable<string[]>;

    constructor(private tasksService: TasksService, public statisticsService: StatisticsService) {}

    ngOnInit(): void {
        this.tasks$ = this.tasksService.tasks$.asObservable();
    }
}
