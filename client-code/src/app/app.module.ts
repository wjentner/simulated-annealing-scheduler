import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatLuxonDateModule } from '@angular/material-luxon-adapter';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DatesComponent } from './dates/dates.component';
import { MinMaxConstraintsComponent } from './min-max-constraints/min-max-constraints.component';
import { ReallyDeleteComponent } from './really-delete/really-delete.component';
import { RunAlgorithmComponent } from './run-algorithm/run-algorithm.component';
import { SaveComponent } from './save/save.component';
import { SelectablePersonsComponent } from './selectable-persons/selectable-persons.component';
import { SolutionsComponent } from './solutions/solutions.component';
import { StatisticsComponent } from './statistics/statistics.component';
import { TasksComponent } from './tasks/tasks.component';
import { TimeConstraintsComponent } from './time-constraints/time-constraints.component';

@NgModule({
    declarations: [
        AppComponent,
        DatesComponent,
        MinMaxConstraintsComponent,
        TimeConstraintsComponent,
        StatisticsComponent,
        SaveComponent,
        SolutionsComponent,
        RunAlgorithmComponent,
        TasksComponent,
        SelectablePersonsComponent,
        ReallyDeleteComponent,
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        HttpClientModule,
        FormsModule,
        MatIconModule,
        MatListModule,
        MatDatepickerModule,
        MatLuxonDateModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        MatToolbarModule,
        MatTableModule,
        MatSnackBarModule,
        MatTooltipModule,
        MatProgressBarModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
