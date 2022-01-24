import { Component, OnInit } from '@angular/core';
import { TasksService } from '../tasks.service';

@Component({
    selector: 'app-tasks',
    templateUrl: './tasks.component.html',
    styleUrls: ['./tasks.component.less'],
})
export class TasksComponent implements OnInit {
    tasks: string[];
    newTask: string;

    constructor(private tasksService: TasksService) {}

    ngOnInit(): void {
        this.tasksService.tasks$.subscribe(t => (this.tasks = t));
    }

    remove(t: string) {
        const idx = this.tasks.indexOf(t);
        this.tasks.splice(idx, 1);
        this.tasksService.tasks$.next(this.tasks);
        this.tasksService.save();
    }

    add() {
        this.tasks.push(this.newTask);
        this.newTask = null;
        this.tasksService.tasks$.next(this.tasks);
        this.tasksService.save();
    }
}
