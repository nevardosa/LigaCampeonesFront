import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthModel} from '../../models/auth/auth.model';
import { ActivatedRoute} from '@angular/router';
import { WSLigaCampeonesService } from '../../services/wsliga-campeones.service';
import { Constantes } from '../../shared/Constantes';

//propiedades
import { StorageService } from '../../services/storage.service';
import { Session } from '../../models/general/session.model';
import { GeneralService } from 'src/app/services/api-ser-general.service';

@Component({
  selector: 'app-change-pass',
  templateUrl: './change-pass.component.html',
  styleUrls: ['./change-pass.component.css']
})
export class ChangePassComponent implements OnInit {
  inicioImg: string = null;
  auth: AuthModel = new AuthModel();
  formaCambioContrasena: FormGroup;
  mostrarPass = "password";
  cargaCompleta: boolean = false;
  validSession: Session = null;
  token: string = null;
  tokenCambio: string = null;

  constructor(private ligaService: WSLigaCampeonesService
    , private activatedRoute: ActivatedRoute
    , private fb: FormBuilder
    , private generalService: GeneralService
    , private storageService: StorageService) {
  }


  ngOnInit(): void {
    this.token = this.activatedRoute.snapshot.paramMap.get('token');
    this.cargarPropiedades();
  }

  crearFormularioCambio() {

    let erPsw = new RegExp(Constantes.PATRON_PSW);
    this.formaCambioContrasena = this.fb.group({
      pass: ['',
        [
          Validators.required,
          Validators.minLength(Number(this.storageService.getValuePropiedad(Constantes.MIN_LENGTH_PSW))),
          Validators.maxLength(Number(this.storageService.getValuePropiedad(Constantes.MAX_LENGTH_PSW))),
          Validators.pattern(erPsw)
        ]],
      repeatPass: ['', Validators.required]
    });
  }
  cargarPropiedades() {

    this.ligaService.cargarInformacionBasica();
    this.cargaCompleta = true;
    this.crearFormularioCambio();
    this.inicioImg = this.storageService.getValuePropiedad(Constantes.INICIO_IMG)

  }
  cambioContrasena() {
    this.token = this.token.substring(1, this.token.length);
    this.ligaService.CambiarContrasena(this.token,
     this.formaCambioContrasena.get('pass').value, this.token).subscribe((resp: AuthModel) => {
      if (resp.codigo != -1) {
        this.generalService.mostrarMensajeAccion('Cambio exitoso!','Se realizó el cambio de contraseña exitosamente','success','/login');
      } 
    });
  }

  /**
      * @summary Valida si las contraseñas coinciden
      * @param _form FormGroup => formulario
      * @return boolean
      */
  private validatePasswordsMatch = (_form: FormGroup): boolean => {
    if (_form.controls['pass'].touched && _form.controls['repeatPass'].touched) {
      if (_form.value.pass === _form.value.repeatPass) {
        return true;
      } else {
        return false;
      }
    }
    return true;
  }

  /**
     * @summary Vefifica las contraseñas que sean validas y coincidan
     * @param _field FormControlName a validar
     * @param _form FormGroup => formulario
     * @return Object json: aplica o no la clase  "is-invalid" borde del input en rojo
     */
  private verifyPasswords = (_field: string, _form: FormGroup): any => {
    let result = false;
    if (!this.validatePasswordsMatch(_form) || !this.isFieldValid(_field, _form)) {
      result = true;
    }
    return { 'is-invalid': result };
  }

  /**
     * @summary Usada para cuando un campo no cumple una validación y  mostrar el mensaje
     * @param _field FormControlName ==> campo a validar
     * @param _form FormGroup ==> Formulario al que pertenece el campo a validar
     * @return boolean
     */
  public isFieldValid(_field: string, _form: FormGroup): boolean {
    let valid = true;
    if (_form.get(_field).invalid && _form.get(_field).touched) {
      valid = false;
    }
    return valid;
  }

  mostrarPassword() {
    this.mostrarPass = (this.mostrarPass == "password") ? "text" : "password";
  }
}
