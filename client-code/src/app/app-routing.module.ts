import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DatesComponent } from './dates/dates.component';
import { MinMaxConstraintsComponent } from './min-max-constraints/min-max-constraints.component';
import { RunAlgorithmComponent } from './run-algorithm/run-algorithm.component';
import { SaveComponent } from './save/save.component';
import { SelectablePersonsComponent } from './selectable-persons/selectable-persons.component';
import { SolutionsComponent } from './solutions/solutions.component';
import { StatisticsComponent } from './statistics/statistics.component';
import { TasksComponent } from './tasks/tasks.component';
import { TimeConstraintsComponent } from './time-constraints/time-constraints.component';

const routes: Routes = [
    {
        path: 'tasks',
        component: TasksComponent,
    },
    {
        path: 'selectable-persons',
        component: SelectablePersonsComponent,
    },
    {
        path: 'dates',
        component: DatesComponent,
    },
    {
        path: 'min-max-constraints',
        component: MinMaxConstraintsComponent,
    },
    {
        path: 'time-constraints',
        component: TimeConstraintsComponent,
    },
    {
        path: 'statistics',
        component: StatisticsComponent,
    },
    {
        path: 'save',
        component: SaveComponent,
    },
    {
        path: 'run-algorithm',
        component: RunAlgorithmComponent,
    },
    {
        path: 'solutions',
        component: SolutionsComponent,
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, {})],
    exports: [RouterModule],
})
export class AppRoutingModule {}
