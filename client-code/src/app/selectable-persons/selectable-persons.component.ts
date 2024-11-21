import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { SelectablePerson, SelectablePersonsService } from '../selectable-persons.service';

@Component({
    selector: 'app-selectable-persons',
    templateUrl: './selectable-persons.component.html',
    styleUrls: ['./selectable-persons.component.less'],
    standalone: false
})
export class SelectablePersonsComponent implements OnInit {
    selectablePersons$: Observable<SelectablePerson[]>;

    newPerson: SelectablePerson = {
        id: '',
        name: '',
    };

    fileName = '';

    constructor(private selectablePersonService: SelectablePersonsService) {}

    ngOnInit(): void {
        this.selectablePersons$ = this.selectablePersonService.selectablePersons$;
    }

    add() {
        const p = this.selectablePersonService.selectablePersons$.value;

        p.push({ ...this.newPerson });
        this.newPerson = {
            id: '',
            name: '',
        };

        this.selectablePersonService.selectablePersons$.next(p);
        this.selectablePersonService.save();
    }

    remove(p: SelectablePerson) {
        const d = this.selectablePersonService.selectablePersons$.value;

        const idx = d.indexOf(p);
        d.splice(idx, 1);

        this.selectablePersonService.selectablePersons$.next(d);
        this.selectablePersonService.save();
    }

    onFileSelected(event) {
        const file: File = event.target.files[0];

        if (file) {
            this.selectablePersonService.vereinsfliegerImport(file);
        }
    }
}
