import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatLuxonDateModule } from '@angular/material-luxon-adapter';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
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
