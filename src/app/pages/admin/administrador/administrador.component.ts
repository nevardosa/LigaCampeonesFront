import { Component, OnInit } from '@angular/core';
import { UserModel, responseADMUsuarios, usuarioResponseADMUsuarios } from '../../../models/user/user.model';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router, ActivatedRoute } from '@angular/router';
import { WSLigaCampeonesService } from '../../../services/wsliga-campeones.service';
import { CookieService } from 'ngx-cookie-service';
import { Constantes } from 'src/app/shared/Constantes';
import { AuthTokenService } from 'src/app/services/auth-token.service';
import { Token } from 'src/app/models/auth/auth.model';
import { StorageService } from 'src/app/services/storage.service';

@Component({
  selector: 'app-administrador',
  templateUrl: './administrador.component.html',
  styleUrls: ['./administrador.component.css']
})
export class AdministradorComponent implements OnInit {

  listaUsuariosAdministradores: usuarioResponseADMUsuarios[] = [];
  lstEstado: string[] = [];
  user: UserModel = new UserModel();//usuario creado para poder consumir los servicios
  cargacompleta: boolean = false;
  token: string = null;
  isDisabled: boolean = true;
  formConsulta: FormGroup;
  tempBuscar;

  constructor(private ligaService: WSLigaCampeonesService
    , private fb: FormBuilder
    , private router: Router
    , private cookieService: CookieService
    , private authTokenService: AuthTokenService
    , private storageService: StorageService) { }

  ngOnInit(): void {
    let estado = Constantes.CONST_LISTADO_ESTADOS
    this.lstEstado = estado.split(',');
    this.ConsultarDataUserAdmin(this.user);
    this.crearFormulario();
  }
  // tslint:disable-next-line: typedef
  crearFormulario() {
    let PTR_SOLO_DIGITOS = new RegExp(Constantes.PATRON_SOLO_DIGITOS);
    this.formConsulta = this.fb.group({
      nombres: ['',],
      apellido: ['',],
      cedula: ['', Validators.compose([Validators.pattern(PTR_SOLO_DIGITOS)])],
      correo: [''],
      perfil: this.storageService.getValuePropiedad(Constantes.PROP_ID_PERFIL_ADMIN), //utilizado para consultar unicamente los usuarios administradores
      activo: ['']
    });
  }

  filterEstado(event) {
    let status;
    event.target.checked == true ? status = 0 : status = 1;
    this.formConsulta.patchValue({
      activo: status,
      perfil: this.storageService.getValuePropiedad(Constantes.PROP_ID_PERFIL_ADMIN)
    });

    this.buscar();
  }

  //mensajes de validacion al formulario
  count_validation_messages = {
    'cedula': [
      { type: 'pattern', message: 'Cedula debe ser un valor numérico' }
    ],
    'correo': [
      { type: 'pattern', message: 'Formato no valido de correo' }
    ],
  }
  validarError(formulario: any, nombreCampo: string, tipoError: any) {
    return formulario.get(nombreCampo).hasError(tipoError)
      && (formulario.get(nombreCampo).dirty || formulario.get(nombreCampo).touched)
  }

  // tslint:disable-next-line: typedef
  get filtroCedulaNoValido() {
    return this.formConsulta.get('cedula').invalid && this.formConsulta.get('cedula').touched;
  }
  // tslint:disable-next-line: typedef
  get filtroCorreoNoValido() {
    return this.formConsulta.get('correo').invalid && this.formConsulta.get('correo').touched;
  }
  buscar() {
    if (this.formConsulta.invalid) {
      return;
    }
    this.tempBuscar = this.formConsulta.get('activo').value;
    if (this.formConsulta.get('activo').value != undefined && this.formConsulta.get('activo').value != null) {
      this.formConsulta.patchValue({
        activo: (this.formConsulta.get('activo').value == 'Activo') ? 0 : 1
      });
    }
    this.cargacompleta = false;
    this.ConsultarDataUserAdmin(this.formConsulta.value);
  }

  limpiarBusqueda() {
    this.cargacompleta = false;
    this.crearFormulario();
    this.ConsultarDataUserAdmin(this.formConsulta.value);
  }

  editarUsuario(usuario: UserModel) {
    this.router.navigate([`administrador/administrador/:${usuario.cedula}`]);
  }

  ConsultarDataUserAdmin(usuario: UserModel) {
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      usuario.idPerfil = Number(this.storageService.getValuePropiedad(Constantes.PROP_ID_PERFIL_ADMIN));
      this.ligaService.ConsultarUsuarioAdmin(usuario, this.token).subscribe((responseUsarios: responseADMUsuarios) => {
        this.cargacompleta = true;
        Swal.close();

        if (responseUsarios.codigo == Constantes.CODIGO_EXITOSO && responseUsarios.cursorUsuarios) {
          this.listaUsuariosAdministradores = responseUsarios.cursorUsuarios;
          if (this.tempBuscar != undefined) {
            this.formConsulta.patchValue({
              activo: this.tempBuscar
            });
          }
          return;
        }
        if (responseUsarios.codigo != Constantes.CODIGO_EXITOSO) {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo consultar la informacion',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#f53201'
          });
        }
      });
    });
  }

  delete(user: UserModel) {
    if (!this.permitirEliminar(user.cedula)) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se puede eliminar a si mismo',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#f53201'
      });
    }
    Swal.fire({
      title: '¿Está seguro?',
      text: `que deseas eliminar a ${user.nombres} ${user.apellido} como usuario administrador`,
      icon: 'question',
      showCancelButton: true,
      cancelButtonColor: '#f53201',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3085d6'
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          text: 'Eliminando como usuario administrador',
          allowOutsideClick: false
        });
        Swal.showLoading();
        //se inactiva usuario
        user.activo = Constantes.PROP_USUARIO_INACTIVO;
        this.authTokenService.authToken().subscribe((resp: Token) => {
          this.token = resp.token
          if (user.cambioClave == null) {
            user.cambioClave = false;
          }
          this.ligaService.ActualizarUsuario(user, this.token).subscribe(resp => {
            Swal.fire({
              title: 'Usuario Administrador Eliminado',
              icon: 'success',
              confirmButtonColor: '#3085d6',
              cancelButtonColor: '#f53201',
              confirmButtonText: 'Aceptar'
            });
            this.ConsultarDataUserAdmin(this.user);
          });
        });
      }
    });

  }

  permitirEliminar(cedula: number) {
    return Number(this.cookieService.get(Constantes.CEDULA)) != cedula;
  }
}
