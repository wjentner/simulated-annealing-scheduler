import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatLuxonDateModule } from '@angular/material-luxon-adapter';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
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
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { CanvasJSAngularChartsModule } from '@canvasjs/angular-charts';

@NgModule({ declarations: [
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
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
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
        MatCardModule,
        CanvasJSAngularChartsModule], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class AppModule {}
