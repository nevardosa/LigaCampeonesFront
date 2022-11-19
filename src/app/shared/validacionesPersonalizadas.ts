import { FormControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';

export class ValidacionesPropias {
    static tamanoCero(control: FormControl): ValidationErrors {
        return  control != null && control.value != 0    ? null : {tamanoCero:true};
    }
}
