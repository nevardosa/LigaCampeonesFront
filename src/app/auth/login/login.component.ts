import { Component, OnInit, Renderer2 } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthModel, Token } from '../../models/auth/auth.model';

import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { UserModel, ResponseValidarUsuarioModel, responseADMUsuarios } from '../../models/user/user.model';
import { WSLigaCampeonesService } from '../../services/wsliga-campeones.service';
import { Constantes } from '../../shared/Constantes';

//propiedades
import { StorageService } from '../../services/storage.service';
import { Session } from '../../models/general/session.model';
import { GeneralService } from 'src/app/services/api-ser-general.service';
import { AdmPerfilesService } from 'src/app/services/api-adm-perfiles.service';
import { ParametrosEAFResponse } from 'src/app/models/admPerfiles/propiedades.model';
import { AuthTokenService } from 'src/app/services/auth-token.service';
import { HttpErrorResponse } from '@angular/common/http';
import { IpServiceService } from 'src/app/services/ip-service.service';
import { PerfilModel, respuestaPerfilModel } from 'src/app/models/perfil.model';
import { Observable } from 'rxjs';
import { DataStorageByStatesService } from 'src/app/services/data-storage-by-states.service';
import { responseSuccessFactor } from 'src/app/models/successFactor.model';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  iniciarSesion = Constantes.CONST_INICIAR_SESION;
  registrate = Constantes.CONST_REGISTRATE_GANA;
  UserPass = Constantes.CONST_USUARIO_PASS;
  ingresaPass = Constantes.CONST_INGRESA_PASS;
  ingresaPerfil = Constantes.CONST_INGRESA_PERFIL;
  olvidePass = Constantes.CONST_OLVIDE_PASS;
  noRegistrado = Constantes.CONST_NO_REGISTRADO;
  iniciaRegis = Constantes.CONST_INICA_REGISTRO;
  registrame = Constantes.CONST_REGISTRAME;
  participaConcursoUno = this.storageService.getValuePropiedad(Constantes.CONS_DESC_CONCUR_PARTE_UNO);
  nombreConcurso = this.storageService.getValuePropiedad(Constantes.CONS_NOMBRE_CONCURSO); 
  participaConcursoDos = this.storageService.getValuePropiedad(Constantes.CONS_DESC_CONCUR_PARTE_DOS);

  inicioImg: string = null;
  auth: AuthModel = new AuthModel();
  formaLogin: FormGroup;
  formaRegister: FormGroup;
  formaForget: FormGroup;
  mostrarPass = "password";
  cargaCompleta: boolean = false;
  colapsible: boolean = true;
  validSession: Session = null;
  token: string = null;
  textToolTip: string = 'Seleccione un perfil';
  listPerfiles: PerfilModel[]
  listPerfilesRegistro: PerfilModel[]
  private perfiles$: Observable<PerfilModel[]>;
  ipAddress: string;
  url: string;
  estComponente: boolean = false;
  texto: string;

  idPerfilRegistrar: number;

  constructor(private ligaService: WSLigaCampeonesService
    , private fb: FormBuilder
    , private router: Router
    , private renderer: Renderer2
    , private generalService: GeneralService
    , private admPerfilesService: AdmPerfilesService
    , private cookieService: CookieService
    , private storageService: StorageService
    , private authTokenService: AuthTokenService
    , private ip: IpServiceService
    , private dataStorage: DataStorageByStatesService) {
  }

  ngOnInit(): void {    
    this.cargarPropiedades();  
    this.consultaMethod();   
  }  
  cargarPerfiles() {
    this.authTokenService.authTokenRegistroNuevo().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.consultarPerfiles(new PerfilModel(), this.token).subscribe((responsePerfil: respuestaPerfilModel) => {
        this.listPerfiles = responsePerfil.listaPerfiles;
        this.listPerfilesRegistro = responsePerfil.listaPerfiles.filter(function (e) {
          return (Number(e.idPerfil) != Number(Constantes.PROP_ID_PERFIL_ADMIN));
        })
      });
    });
  }

  colapse(){
    this.colapsible = !this.colapsible;
  }


  cargarToolTip(idPerfil: number) {
    let perfil = this.listPerfiles.find(item => item.idPerfil === idPerfil);
    this.textToolTip = 'Seleccione un perfil';
      if(  perfil != undefined ){
        this.textToolTip = perfil.descripcionPerfil;
      }
  }
  // tslint:disable-next-line: typedef
  get userNoValido() {
    return this.formaLogin.get('user').invalid && this.formaLogin.get('user').touched;
  }

  // tslint:disable-next-line: typedef
  get passNoValido() {
    return this.formaLogin.get('pass').invalid && this.formaLogin.get('pass').touched;
  }

  // tslint:disable-next-line: typedef
  get perfilLoginNoValido() {
    return this.formaLogin.get('perfilLogin').invalid && this.formaLogin.get('perfilLogin').touched;
  }

  get perfilRegistroNoValido() {
    return this.formaRegister.get('perfilRegistro').invalid && this.formaRegister.get('perfilRegistro').touched;
  }
  getPerfil(): number {
    return Number(this.formaLogin.get('perfilLogin').value);
  }

  getPerfilRegistro(): number {
    return Number(this.formaRegister.get('perfilRegistro').value);
  }

  redirect() {
    this.authTokenService.authTokenRegistroNuevo().subscribe((resp: Token) => {
      this.token = resp.token
      this.cookieService.set('token', this.token);
      this.router.navigate(['/cambiarContrasena']);
    });

  }
  get CedulaNoValido() {
    return this.formaRegister.get('cc').invalid && this.formaRegister.get('cc').touched;
  }

  get CedulaCambioContrasenaNoValido() {
    return this.formaForget.get('CedulaCambio').invalid && this.formaForget.get('CedulaCambio').touched;
  }

  // tslint:disable-next-line: typedef
  crearFormularioLogin() {
    let er = new RegExp(Constantes.PATRON_SOLO_DIGITOS);
    this.formaLogin = this.fb.group({
      user: ['', Validators.compose([Validators.required
        , Validators.pattern(er)])],
      pass: ['', Validators.required],
      perfilLogin: ['', Validators.required]
      //admin: ['']
    });
  }

  count_validation_messages = {
    'user': [
      { type: 'required', message: 'Debe ingresar su cédula.' },
      { type: 'pattern', message: 'Cedula debe ser numérico' }
    ],
    'cc': [
      { type: 'required', message: 'Debe ingresar su cédula.' },
      { type: 'pattern', message: 'Cedula debe ser numérico' }
    ]
  }

  validarError(formulario: any, nombreCampo: string, tipoError: any) {
    return formulario.get(nombreCampo).hasError(tipoError)
      && (formulario.get(nombreCampo).dirty || formulario.get(nombreCampo).touched)
  }

  crearFormularioRegister() {
    let PTR_SOLO_DIGITOS = new RegExp(Constantes.PATRON_SOLO_DIGITOS);
    this.formaRegister = this.fb.group({
      cc: ['', [Validators.required, , Validators.pattern(PTR_SOLO_DIGITOS)]],
      perfilRegistro: ['', [Validators.required]]
    });
  }

  crearFormularioForget() {
    let PTR_SOLO_DIGITOS = new RegExp(Constantes.PATRON_SOLO_DIGITOS);
    this.formaForget = this.fb.group({
      CedulaCambio: ['', [Validators.required, , Validators.pattern(PTR_SOLO_DIGITOS)]]
    });
  }

  Login() {
    if (this.formaLogin.invalid) {
      return Object.values(this.formaLogin.controls).forEach(control => {
        control.markAsTouched();
      });
    }
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();

    this.cookieService.set('user', btoa(this.formaLogin.get('user').value));
    this.cookieService.set('pass', btoa(this.formaLogin.get('pass').value));

    this.authTokenService.authToken().subscribe((resp: Token) => {

      Swal.close();
      if (resp.token == null || resp.token == "") {
        this.generalService.mostrarMensaje('Oops...', 'Usuario y contraseña no validos', 'error');
        return;
      } else {
        this.token = resp.token
        this.cookieService.set('token', this.token);

        let idPerfilSolicitado: number = this.formaLogin.get('perfilLogin').value;
        let user: string = this.formaLogin.get('user').value;
        let pass: string = this.formaLogin.get('pass').value;

        this.ligaService.IniciarSesion(user, pass, idPerfilSolicitado, this.token).subscribe((resp: ResponseValidarUsuarioModel) => {

          if (resp == null || resp.codigo != Constantes.CODIGO_EXITOSO) {
            this.generalService.mostrarMensaje('Oops...', 'Credenciales invalidas', 'error');
            return;
          }

          let id_perfil_admin = Number(this.storageService.getValuePropiedad(Constantes.PROP_ID_PERFIL_ADMIN));

          this.setUserCoockie(resp.usuario);
          let session = this.storageService.getCurrentSession();
          session.token = this.token;
          this.storageService.setCurrentSession(session);

          this.cookieService.set(Constantes.PROP_PERFIL_LOGUEADO, idPerfilSolicitado.toString());
          this.cookieService.set(Constantes.PROP_TIPO_CONTRATO_LOGIN, resp.usuario.tipoContrato);
          this.cookieService.set('usuarioEditor', resp.usuario.nombres + " " + resp.usuario.apellido);
          //dirigir menu ADMINISTRADOR
          if (idPerfilSolicitado == id_perfil_admin && resp.usuario.idPerfil == id_perfil_admin) {
            this.cookieService.set('admin', 'true', { expires: 5 });
            this.router.navigate(['/administrador/pedido']).then(() => {
              window.location.reload();
            });
            return;
          }

          this.cookieService.set('admin', 'false', { expires: 5 });
          this.router.navigate(['/usuario/inicio']).then(() => {
            window.location.reload();
          });

        });//fin login  
      }
    }, (error: HttpErrorResponse) => {
      if (error.status == 412) {
        this.generalService.mostrarMensaje('Oops...', 'Tu usuario se encuentra inactivo, te recordamos que se activará nuevamente cuando te ingresen puntos', 'error');
        return;
      }
      this.generalService.mostrarMensaje('Oops...', 'Error validando información, por favor vuelva a intentarlo', 'error');
      console.log(error.status + " " + error.statusText);
    });
  }



  getIP() {
    let url = this.storageService.getValuePropiedad(Constantes.ENDPOINT_OBTENER_IP);
    this.ip.getIPAddress(url).subscribe((res: any) => {
      this.ipAddress = res.ip;
      window.localStorage.setItem('ip', this.ipAddress)
    });
  }

  cargarPropiedades() {
    this.storageService.logout();
    //CONSULTAR PROPIEDADES
    this.admPerfilesService.consultarPropiedades(Constantes.NOMBRE_APLICACION, null).subscribe((parametrosEAFResponse: ParametrosEAFResponse) => {
      // console.log(parametrosEAFResponse);
      let session: Session = {
        token: null,
        uuid: this.generalService.UUID,
        propiedades: parametrosEAFResponse.cursorparametros.parametros
      };
      this.storageService.setCurrentSession(session);
      this.ligaService.cargarInformacionBasica();
      this.cargaCompleta = true;
      this.cargarPerfiles();

      //this.getIP();
      this.crearFormularioLogin();
      this.crearFormularioRegister();
      this.crearFormularioForget();
      this.inicioImg = this.storageService.getValuePropiedad(Constantes.INICIO_IMG);

    });//fin cargue de propiedades
  }
  getPerfilSuccesFactor(infoSuccess: responseSuccessFactor) {
    //validar si es vendedor
    if (infoSuccess.channel != null && infoSuccess.channel != '' && infoSuccess.channel != 'NO APLICA') {
      return Constantes.PROP_ID_PERFIL_VENDEDOR;
    }//validar si es usuario directo
    else if ((infoSuccess.channel == null || infoSuccess.channel == '' || infoSuccess.channel == 'NO APLICA') && this.getTipoContratoSuccessFactor(infoSuccess) == Constantes.CONST_TIPO_CONTRATO_DIRECTO) {
      return Constantes.PROP_ID_PERFIL_DIRECTO;
    }
    else {
      return Constantes.PROP_ID_PERFIL_TECNICO;
    }
  }
  getTipoContratoSuccessFactor(infoSuccess: responseSuccessFactor) {
    if (infoSuccess.typeContract == Constantes.CONST_TIPO_CONTRATO_ALIADO_SUCCESS_FACTOR) {
      return Constantes.CONST_TIPO_CONTRATO_TERCERO;
    } else if (infoSuccess.typeContract == Constantes.CONST_TIPO_CONTRATO_INDEFINIDO_SUCCESS_FACTOR) {
      return Constantes.CONST_TIPO_CONTRATO_DIRECTO;
    }
  }

  consultarUsuarioSuccessFactor() {
    if (this.formaRegister.invalid) {
      return Object.values(this.formaRegister.controls).forEach(control => {
        control.markAsTouched();
      });
    }
    Swal.fire({
      text: 'Consultando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
    this.authTokenService.authTokenRegistroNuevo().subscribe((resp: Token) => {
      this.token = resp.token

      this.idPerfilRegistrar = this.formaRegister.get('perfilRegistro').value;
      let cedulaRegistrar = this.formaRegister.get('cc').value;

      this.dataStorage.validarSuccessFactor(cedulaRegistrar).subscribe((responseSuccessFactorA: any) => {
        let responseSuccessFactor: responseSuccessFactor = responseSuccessFactorA;
        let idPerfilSuccessFactor = this.getPerfilSuccesFactor(responseSuccessFactor);
        if (idPerfilSuccessFactor == null || idPerfilSuccessFactor != this.idPerfilRegistrar) {
          this.generalService.mostrarMensaje("Error", "Información inválida para el perfil seleccionado", "error");
          return;
        }

        let usuario = new UserModel();
        usuario.cedula = cedulaRegistrar;

        this.cookieService.set('usuarioEditor', responseSuccessFactor.fullName);
        this.ligaService.ConsultarUsuario(usuario, this.token).subscribe((resp: responseADMUsuarios) => {
          Swal.close();
          if (resp.codigo != Constantes.CODIGO_EXITOSO || null == resp.cursorUsuarios) {
            this.generalService.mostrarMensaje("Error", "No fue posible consultar la informacion en liga de campeones", "error");
            return;
          }

          let cursorAux = resp.cursorUsuarios.filter(function (e) { return (Number(e.cedula) == cedulaRegistrar); });
          if (cursorAux.length >= 1) {
            this.generalService.mostrarMensaje("Error", "La cedula ingresada ya se encuentra registrada en Liga de Campeones.", "error");
            return;
          } else if (cursorAux.length == 0) {
            this.cookieService.set(Constantes.COOKIE_ID_CONTRATO_REGISTRAR, this.getTipoContratoSuccessFactor(responseSuccessFactor));
            this.cookieService.set(Constantes.COOKIE_ID_PERFIL_REGISTRAR, this.idPerfilRegistrar.toString());
            let idp = this.idPerfilRegistrar;
            let perfil: PerfilModel[] = this.listPerfilesRegistro.filter(function (e) { return (Number(e.idPerfil) == idp); });
            this.cookieService.set(Constantes.COOKIE_NOMBRE_PERFIL_REGISTRAR, perfil[0].nombrePerfil);
            this.router.navigate(['/register', this.formaRegister.get('cc').value]);
          }
        });

      },
        (error) => {
          if (error.status == 400) {
            this.generalService.mostrarMensaje("Error", this.storageService.getValuePropiedad(Constantes.PROP_ERROR_CONSULTA_SUCCESS_FACTOR), "error");
          }

        });

    });
  }

  ConsultarUsuarioRedMaestra() {
    if (this.formaRegister.invalid) {
      return Object.values(this.formaRegister.controls).forEach(control => {
        control.markAsTouched();
      });
    }

    Swal.fire({
      text: 'Consultando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
    this.authTokenService.authTokenRegistroNuevo().subscribe((resp: Token) => {
      this.token = resp.token

      this.ligaService.ConsultarUsuarioRedMaestra(this.formaRegister.get('cc').value, this.token).subscribe(resp => {
        if (resp.exist.toUpperCase() == "n".toUpperCase()) {
          Swal.close();
          this.generalService.mostrarMensaje('Oops...', 'Al verificar tu cédula encontramos que no apareces registrado en Red Maestra. Por favor consulta tu información.', 'error');
          return;
        }

        let user = new UserModel();
        user.cedula = this.formaRegister.get('cc').value;
        this.cookieService.set('usuario', this.formaRegister.get('cc').value, { expires: 5 });
        this.ligaService.ConsultarUsuario(user, this.token).subscribe((resp: responseADMUsuarios) => {
          Swal.close();
          if (resp.codigo != Constantes.CODIGO_EXITOSO || null == resp.cursorUsuarios) {
            this.generalService.mostrarMensaje("Error", "No fue posible consultar la informacion en liga de campeones", "error");
            return;
          }

          let cursorAux = resp.cursorUsuarios.filter(function (e) { return (Number(e.cedula) == user.cedula); })
          if (cursorAux.length >= 1) {
            this.generalService.mostrarMensaje("Error", "La cedula ingresada ya se encuentra registrada en Liga de Campeones.", "error");
            return;
          } else if (cursorAux.length == 0) {
            this.router.navigate(['/register', this.formaRegister.get('cc').value]);
          }
        });//fin consulta INFO USUARIO
      });//fin consulta RED MAESTRA
    });
  }

  CreateLink() {
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();

    this.authTokenService.authTokenRegistroNuevo().subscribe((resp: Token) => {
      this.token = resp.token
      if (resp.token == null) {
        this.generalService.mostrarMensaje('Oops...', 'Se presentó un problema, intente más tarde', 'error');
        return;
      } else {
        this.token = resp.token
        this.cookieService.set('token', this.token);
        this.cookieService.set('cedulaCambio', this.formaForget.get('CedulaCambio').value);

        this.ligaService.CambiarContrasena(this.formaForget.get('CedulaCambio').value, '', this.token).subscribe((resp: AuthModel) => {
          if (resp.codigo != Constantes.CODIGO_EXITOSO) {
            this.generalService.mostrarMensaje('Oops...', 'Se presentó un problema, intente más tarde', 'error');
            return;
          }
          this.generalService.mostrarMensajeAccion('Envío exitoso!',
            'Se ha enviado un mensaje al correo registrado en la aplicación para realizar el re establecimiento de contraseña',
            'success', '/login'
          );

        });
      }
    });
  }

  setUserCoockie(usuario: any) {
    const TIEMPO_EXPIRACION: number = Number(this.storageService.getValuePropiedad(Constantes.TIEMPO_EXPIRACION));
    this.cookieService.set(Constantes.NOMBRE_USUARIO, usuario.nombres + " " + usuario.apellido, { expires: TIEMPO_EXPIRACION });
    this.cookieService.set(Constantes.CEDULA, usuario.cedula.toString(), { expires: TIEMPO_EXPIRACION });
    this.cookieService.set('usuario', this.formaLogin.get('user').value, { expires: 5 });
    this.cookieService.set('celular', usuario.celular.toString());
  }

  mostrarPassword() {
    this.mostrarPass = (this.mostrarPass == "password") ? "text" : "password";
  }

  consultaMethod() {
    this.estComponente = this.storageService.getValuePropiedad(Constantes.PROP_COMPONENTE_ESTADO) == 'true';
    if (this.estComponente) {
      this.texto = this.storageService.getValuePropiedad(Constantes.PROP_COMPONENTE_FLOTANTE_NAME);
      this.url = this.storageService.getValuePropiedad(Constantes.PROP_COMPONENTE_FLOTANTE_URL);
    }
  }

goToLink() {
  window.open(this.url, "_blank");
}

}
