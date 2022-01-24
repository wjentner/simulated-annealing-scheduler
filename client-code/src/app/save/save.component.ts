import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ScheduleConstraints, ScheduleConstraintsService } from '../schedule-constraints.service';

@Component({
    selector: 'app-save',
    templateUrl: './save.component.html',
    styleUrls: ['./save.component.less'],
})
export class SaveComponent implements OnInit {
    result$: Observable<any>;
    constraints$: Observable<ScheduleConstraints>;

    constructor(private scheduleConstraintsService: ScheduleConstraintsService) {}

    ngOnInit(): void {
        this.constraints$ = this.scheduleConstraintsService.constraints$.asObservable();
    }

    save() {
        this.scheduleConstraintsService.save();
    }
}
