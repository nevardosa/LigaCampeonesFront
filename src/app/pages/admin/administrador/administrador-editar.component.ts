import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { LugaresModel, RespuestaLugaresModel } from '../../../models/lugares/lugares.model';
import { WSLigaCampeonesService } from '../../../services/wsliga-campeones.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UserModel, responseADMUsuarios, usuarioResponseADMUsuarios } from '../../../models/user/user.model';
import { Constantes } from 'src/app/shared/Constantes';
import Swal from 'sweetalert2';
import { Observable } from 'rxjs';
import { StorageService } from 'src/app/services/storage.service';
import { GeneralService } from 'src/app/services/api-ser-general.service';
import { AuthTokenService } from 'src/app/services/auth-token.service';
import { Token } from 'src/app/models/auth/auth.model';
import { CookieService } from 'ngx-cookie-service';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { AppDateAdapter, APP_DATE_FORMATS } from 'src/app/shared/date-format/format-datepicker';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { DatePipe } from '@angular/common'
import { contratosDTO, parametrosDTO, ParametrosEAFResponse } from 'src/app/models/admPerfiles/propiedades.model';
import { PerfilModel, respuestaPerfilModel } from 'src/app/models/perfil.model';
import { AdmPerfilesService } from 'src/app/services/api-adm-perfiles.service';

@Component({
  selector: 'app-administrador-editar',
  templateUrl: './administrador-editar.component.html',
  styleUrls: ['./administrador-editar.component.css'],
  providers: [
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }
  ]
})
export class AdministradorEditarComponent implements OnInit {

  formaAdministrador: FormGroup;
  listaDepartamentos: LugaresModel[] = [];
  listaCiudades: LugaresModel[] = [];
  isEdicion: boolean = false;
  canales: string[] = [];
  maxDate: Date;
  showAge: number;
  menorEdad: boolean;
  TyC: string;
  isEnabled: boolean;
  @ViewChild('divTyC') div: ElementRef;
  auxClave: string = 'atjw=860*';
  isDisabled: boolean = true;

  //variables para mostrar la contraseña
  fieldTextTypeClave: boolean;
  fieldTextTypeRptClave: boolean;
  token: string = null;
  contrasenaAuxVisible: string = "asdf574*";
  contrato: contratosDTO = new contratosDTO();
  listContratos: contratosDTO[] = [];
  contratoSeleccionado: contratosDTO = new contratosDTO();

  constructor(private fb: FormBuilder
    , private cookieService: CookieService
    , private ligaService: WSLigaCampeonesService
    , private generalService: GeneralService
    , private activatedRoute: ActivatedRoute
    , private router: Router
    , private storageService: StorageService
    , private renderer: Renderer2
    , private authTokenService: AuthTokenService
    , public datepipe: DatePipe
    , private admPerfilesService: AdmPerfilesService
  ) {
    this.maxDate = new Date();
  }

  ngOnInit(): void {
    this.crearFormulario();
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    this.cargarCanales();
    this.cargarContratos();
    if (id != 'nuevo') {
      Swal.fire({
        text: 'Cargando Información',
        allowOutsideClick: false
      });
      Swal.showLoading();
      this.isEdicion = true;
      this.consultarUsuario(Number(id.valueOf().replace(':', '')));
    }
  }

  toggleFieldTextTypeClave() {
    this.fieldTextTypeClave = !this.fieldTextTypeClave;
  }
  toggleFieldTextTypeRptClave() {
    this.fieldTextTypeRptClave = !this.fieldTextTypeRptClave;
  }

  // tslint:disable-next-line: typedef
  crearFormulario() {
    let er = new RegExp(Constantes.PATRON_DIGITOS);
    let PTR_SOLO_DIGITOS = new RegExp(Constantes.PATRON_SOLO_DIGITOS);
    this.formaAdministrador = this.fb.group({
      nombres: ['', [Validators.required]],
      canal: ['', [Validators.required]],
      apellido: ['', Validators.required],
      FNacimiento: ['', Validators.required],
      direccion: ['', Validators.required],
      barrio: ['', Validators.required],
      cedula: ['', Validators.compose([Validators.required
        , Validators.pattern(PTR_SOLO_DIGITOS)
      ])
      ],
      celular: ['', [
        Validators.required,
        Validators.maxLength(Constantes.MAX_LENGTH_CEL),
        Validators.minLength(Constantes.MIN_LENGTH),
        Validators.pattern(er)]],
      departamento: ['', [Validators.required]],
      idCiudad: ['', [Validators.required]],
      correo: ['', [Validators.required, Validators.pattern('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3}$')]],
      clave: ['', [
        Validators.required,
        Validators.minLength(6), Validators.maxLength(30),
        Validators.pattern('^(?!.*(?:123|abc|ABC|Abc|aBc|abC|ABc|aBC|AbC)).*$')
      ]],
      repetirClave: ['', Validators.required],
      activo: ['',],
      idPerfil: this.storageService.getValuePropiedad(Constantes.PROP_ID_PERFIL_ADMIN),
      tipoContrato: ['', Validators.required]
    });
    this.cargarDepartamento();
  }
  //mesnajes de validacion al formulario
  count_validation_messages = {
    'cedula': [
      { type: 'required', message: 'Debe ingresar su cédula.' },
      { type: 'pattern', message: 'Cedula debe ser numérico' }
    ]
  }

  cargarTerminoContrato($event: any) {
    const p: HTMLParagraphElement = this.renderer.createElement('div');
    if ($event.target.value != '' && $event.target.value != undefined) {
      var contrato = $event.target.value;
      this.listContratos.find(elem => {
        if (elem.name.toUpperCase() == contrato.toUpperCase()) {
          this.contratoSeleccionado = elem;
        }
      });
      this.div.nativeElement.innerHTML = '';
      if (this.contratoSeleccionado.terminos != null) {
        p.innerHTML = atob(this.contratoSeleccionado.terminos);
        this.renderer.appendChild(this.div.nativeElement, p);
      }
    }
  }

  cargarContratos() {
    this.admPerfilesService.consultarPropiedades(Constantes.NOMBRE_APLICACION, null).subscribe((parametrosEAFResponse: ParametrosEAFResponse) => {
      if (parametrosEAFResponse.cursorparametros.parametros != null) {
        let parametros: parametrosDTO[] = parametrosEAFResponse.cursorparametros.parametros;
        let newParams: string[] = [];
        const propContratos: any[] = JSON.parse(this.storageService.getValuePropiedad(Constantes.PROP_CONTRATOS));

        parametros.forEach(elem => {
          if (propContratos.some(p => p.nombre === elem.nombre)) {
            newParams.push(elem.valor);
          }
        });
        newParams.forEach(contrato => {
          this.contrato = JSON.parse(contrato.slice(1, -1));
          this.listContratos.push(this.contrato);
        });

      }
    });
  }
  validarError(formulario: any, nombreCampo: string, tipoError: any) {
    return formulario.get(nombreCampo).hasError(tipoError)
      && (formulario.get(nombreCampo).dirty || formulario.get(nombreCampo).touched)
  }

  get cambioClave() {
    return this.formaAdministrador.get('clave').value != this.auxClave ? true : false;
  }

  get cambioRepClave() {
    return this.formaAdministrador.get('repetirClave').value != this.auxClave ? true : false;
  }

  // tslint:disable-next-line: typedef
  get NombreNoValido() {
    return this.formaAdministrador.get('nombres').invalid && this.formaAdministrador.get('nombres').touched;
  }
  // tslint:disable-next-line: typedef
  get ApellidoNoValido() {
    return this.formaAdministrador.get('apellido').invalid && this.formaAdministrador.get('apellido').touched;
  }

  // tslint:disable-next-line: typedef
  get FNacimientoNoValido() {
    if (this.formaAdministrador.get('FNacimiento').valid) {
      this.menorEdad = false;
    }
    return this.formaAdministrador.get('FNacimiento').invalid && this.formaAdministrador.get('FNacimiento').touched;
  }

  // tslint:disable-next-line: typedef
  get DireccionNoValido() {
    return this.formaAdministrador.get('direccion').invalid && this.formaAdministrador.get('direccion').touched;
  }
  // tslint:disable-next-line: typedef
  get CedulaNoValido() {
    return this.formaAdministrador.get('cedula').invalid && this.formaAdministrador.get('cedula').touched;
  }
  // tslint:disable-next-line: typedef
  get CanalNoValido() {
    return this.formaAdministrador.get('canal').invalid && this.formaAdministrador.get('canal').touched;
  }

  // tslint:disable-next-line: typedef
  get ClaveNoValido() {
    return this.formaAdministrador.get('clave').invalid && this.formaAdministrador.get('clave').touched;
  }
  // tslint:disable-next-line: typedef
  get RepetirClaveNoValido() {
    return this.formaAdministrador.get('repetirClave').invalid && this.formaAdministrador.get('repetirClave').touched ||
      this.formaAdministrador.get('repetirClave').value !== this.formaAdministrador.get('clave').value;
  }
  clavesInvalidas() {
    return this.formaAdministrador.get('repetirClave').invalid && this.formaAdministrador.get('repetirClave').touched ||
      this.formaAdministrador.get('repetirClave').value !== this.formaAdministrador.get('clave').value;
  }

  // tslint:disable-next-line: typedef
  get DepartamentoNoValido() {
    return this.formaAdministrador.get('departamento').invalid && this.formaAdministrador.get('departamento').touched;
  }
  // tslint:disable-next-line: typedef
  get CiudadNoValido() {
    return this.formaAdministrador.get('idCiudad').invalid && this.formaAdministrador.get('idCiudad').touched;
  }
  // tslint:disable-next-line: typedef
  get CorreoNoValido() {
    return this.formaAdministrador.get('correo').invalid && this.formaAdministrador.get('correo').touched;
  }
  // tslint:disable-next-line: typedef
  get BarrioNoValido() {
    return this.formaAdministrador.get('barrio').invalid && this.formaAdministrador.get('barrio').touched;
  }
  getDepartamento(): number {
    return Number(this.formaAdministrador.get('departamento').value);
  }
  // tslint:disable-next-line: typedef
  get NumeroCelularNoValido() {
    return this.formaAdministrador.get('celular').invalid && this.formaAdministrador.get('celular').touched;
  }

  get tipoContratoNoValido() {
    return this.formaAdministrador.get('tipoContrato').invalid && this.formaAdministrador.get('tipoContrato').touched;
  }

  cargarDepartamento() {
    let lugar: LugaresModel = new LugaresModel();
    lugar.departamento = 0;
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.ConsultarLugares(lugar, this.token).subscribe((resp: RespuestaLugaresModel) => {
        this.listaDepartamentos = resp.lugares;
      });
    });
  }

  cargarCiudades(idDepartamento: number) {
    let lugar: LugaresModel = new LugaresModel();
    lugar.departamento = idDepartamento;
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.ConsultarLugares(lugar, this.token).subscribe((resp: RespuestaLugaresModel) => {
        this.listaCiudades = resp.lugares;
      });
    });
  }

  consultarUsuario(id: number) {
    let user: UserModel = new UserModel();
    user.cedula = Number(id);
    //se consulta la info del usuario
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.ConsultarUsuarioAdmin(user, this.token).subscribe((responseUsarios: responseADMUsuarios) => {
        if (responseUsarios.codigo == Constantes.CODIGO_EXITOSO && responseUsarios.cursorUsuarios.length >= 1) {
          let lugar: LugaresModel = new LugaresModel();
          lugar.codigoDane = responseUsarios.cursorUsuarios[0].idCiudad;
          //se consulta la info del departamento de la ciudad del usuario
          this.ligaService.ConsultarLugares(lugar, this.token).subscribe((responseLugares: RespuestaLugaresModel) => {
            if (responseLugares.codigo == Constantes.CODIGO_EXITOSO && responseLugares.lugares.length > 0) {

              let cursorAux = responseUsarios.cursorUsuarios.filter(function (e) { return (Number(e.cedula) == user.cedula); });
              this.enviarUsuarioAFormulario(cursorAux[0], responseLugares.lugares[0].departamento);
              //cargar las ciudades del departamento
              this.cargarCiudades(responseLugares.lugares[0].departamento);
              Swal.close();
            }
          });//FIN CONSULTA DE LUGARES
        } else {
          this.generalService.mostrarMensaje('Ooops', 'No se ha podido cargar la información del usuario', 'error');
        }
      });
    });
  }

  enviarUsuarioAFormulario(user: usuarioResponseADMUsuarios, idDep) {
    this.auxClave = user.clave;

    let fechaNacimiento = null;
    if (user.fecha_nacimiento) {
      let f = user.fecha_nacimiento.split("/");
      fechaNacimiento = new Date(f[2] + '/' + f[1] + '/' + f[0]);
    }
    this.formaAdministrador.reset({
      nombres: user.nombres,
      apellido: user.apellido,
      FNacimiento: fechaNacimiento,
      cedula: user.cedula,
      correo: user.correo,
      departamento: idDep,
      idCiudad: user.idCiudad,
      clave: this.contrasenaAuxVisible,
      repetirClave: this.contrasenaAuxVisible,
      direccion: user.direccion,
      celular: user.celular,
      canal: user.canal,
      barrio: user.barrio,
      tipoContrato: user.tipoContrato
    });
  }

  guardar() {
    if (this.formaAdministrador.invalid) {
      return Object.values(this.formaAdministrador.controls).forEach(control => {
        control.markAsTouched();
      });
    }
    if (!this.calcularEdad()) {
      let mensaje: any = (this.isEdicion) ? 'que deseas actualizar a ' :
        'que deseas registrar a ';


      Swal.fire({
        title: '¿Está seguro?',
        text: mensaje + `${this.formaAdministrador.get('nombres').value} ${this.formaAdministrador.get('apellido').value} como usuario administrador`,
        icon: 'question',
        showCancelButton: true,
        cancelButtonColor: '#f53201',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3085d6'
      }).then((result) => {
        if (result.isConfirmed) {
          let peticion: Observable<any>;
          if (this.isEdicion) {
            this.authTokenService.authToken().subscribe((resp: Token) => {
              this.token = resp.token
              peticion = this.ligaService.ActualizarUsuario(this.obtenerUsuarioDeFormulario(), this.token);
              this.peticion(peticion, this.obtenerUsuarioDeFormulario());
            });
          } else {
            this.authTokenService.authToken().subscribe((resp: Token) => {
              this.token = resp.token
              peticion = this.ligaService.CrearUsuario(this.obtenerUsuarioDeFormulario(), this.token);
              this.peticion(peticion, this.obtenerUsuarioDeFormulario());
            });
          }
        } else {
          this.router.navigate(['administrador/articulo']);
        }
      });
    } else {
      Swal.close();
    }
  }

  peticion(peticion: Observable<any>, user: UserModel) {

    peticion.subscribe((responseUsuario: responseADMUsuarios) => {
      if (responseUsuario.codigo == 0) {
        if (user.cedula.toString() == atob(this.cookieService.get('user'))) {
          if (user.clave != null && user.clave != 'undefined') {
            this.cookieService.set('pass', btoa(user.clave));
          }
          if (user.celular != null) {
            this.cookieService.set('celular', user.celular.toString());
          }
        }
        this.generalService.mostrarMensaje('GUARDADO', null, 'success');
        this.router.navigate(['administrador/administrador']);
      } else {
        let mensajeError = "No fue posible guardar la información, vuelva a intentarlo.";
        if (responseUsuario.codigo == -6) {
          mensajeError = 'La cedula es un campo unico, la cedula digitada se está utilizando.';
        }
        this.generalService.mostrarMensaje('ERROR', mensajeError, 'error');
      }
    });
  }

  private obtenerUsuarioDeFormulario(): UserModel {
    let auxCambioClave: boolean;
    let auxClave: string = null;
    let activoTemp: number = null;
    if (this.isEdicion) {
      if (this.formaAdministrador.get('clave').value != this.auxClave) {
        auxCambioClave = true;
        auxClave = this.formaAdministrador.get('clave').value;
      } else {
        auxCambioClave = false;
      }
    } else {
      auxClave = this.formaAdministrador.get('clave').value;
      auxCambioClave = false;
      activoTemp = 0;
    }
    return {
      ...new UserModel(),
      activo: Constantes.PROP_USUARIO_ACTIVO,
      nombres: this.formaAdministrador.get('nombres').value,
      apellido: this.formaAdministrador.get('apellido').value,
      fecha_nacimiento: this.datepipe.transform(this.formaAdministrador.get('FNacimiento').value, 'dd/MM/yyyy'),
      cedula: Number(this.formaAdministrador.get('cedula').value),
      // clave:  (this.contrasenaAuxVisible !=  this.formaAdministrador.get('clave').value ) ?  this.formaAdministrador.get('clave').value: this.auxClave,
      clave: auxClave,
      idCiudad: Number(this.formaAdministrador.get('idCiudad').value),
      correo: this.formaAdministrador.get('correo').value,
      canal: this.formaAdministrador.get('canal').value,
      celular: this.formaAdministrador.get('celular').value,
      direccion: this.formaAdministrador.get('direccion').value,
      barrio: this.formaAdministrador.get('barrio').value,
      // cambioClave: (this.isEdicion && this.contrasenaAuxVisible !=  this.formaAdministrador.get('clave').value )
      cambioClave: auxCambioClave,
      idPerfil: Number(this.storageService.getValuePropiedad(Constantes.PROP_ID_PERFIL_ADMIN)),
      tipoContrato: this.formaAdministrador.get('tipoContrato').value
    };
  }

  cargarCanales() {
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      let perfil: PerfilModel = new PerfilModel();
      perfil.idPerfil = Number(this.cookieService.get(Constantes.PROP_PERFIL_LOGUEADO));
      this.ligaService.consultarPerfiles(perfil, this.token).subscribe((resp: respuestaPerfilModel) => {
        this.canales = resp.listaPerfiles[0].canales.split(Constantes.SEPARADOR);
      });
    });
  }



  /* Los mensajes */
  count_validation_messages_celular = {
    'celular': [
      { type: 'required', message: 'Celular es requerido' },
      { type: 'minlength', message: 'Celular debe contener mínimo 10 digitos' },
      { type: 'maxlength', message: 'Celular debe contener máximo 10 digitos' },
      { type: 'pattern', message: 'Celular debe ser numérico y debe comenzar por 3' }
    ]
  }

  calcularEdad() {
    const convertAge = new Date(this.formaAdministrador.get('FNacimiento').value);
    const timeDiff = Math.abs(Date.now() - convertAge.getTime());
    this.showAge = Math.floor((timeDiff / (1000 * 3600 * 24)) / 365);
    this.menorEdad = false;
    if (this.showAge < 18) {
      this.formaAdministrador.get('FNacimiento').reset();
      this.menorEdad = true;
    }
    return this.menorEdad;
  }

}
