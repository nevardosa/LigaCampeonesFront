import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserModel, responseADMUsuarios } from '../../../models/user/user.model';
import { LugaresModel, RespuestaLugaresModel } from '../../../models/lugares/lugares.model';
import { CookieService } from 'ngx-cookie-service';
import { WSLigaCampeonesService } from '../../../services/wsliga-campeones.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { Constantes } from 'src/app/shared/Constantes';
import { StorageService } from '../../../services/storage.service';
import { AuthTokenService } from 'src/app/services/auth-token.service';
import { Token } from 'src/app/models/auth/auth.model';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { AppDateAdapter, APP_DATE_FORMATS } from 'src/app/shared/date-format/format-datepicker';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { DatePipe } from '@angular/common'
import { contratosDTO, parametrosDTO, ParametrosEAFResponse } from 'src/app/models/admPerfiles/propiedades.model';
import { PerfilModel, respuestaPerfilModel } from 'src/app/models/perfil.model';
import { AdmPerfilesService } from 'src/app/services/api-adm-perfiles.service';


@Component({
  selector: 'app-cuenta',
  templateUrl: './cuenta.component.html',
  styleUrls: ['./cuenta.component.css'],
  providers: [
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }
  ]
})


export class CuentaComponent implements OnInit {
  formaRegistro: FormGroup;
  usuario: UserModel = new UserModel();
  usuarioChange: UserModel = new UserModel();
  LugaresModel: LugaresModel = new LugaresModel();
  lugaresData: LugaresModel = new LugaresModel();
  departamentoArray: LugaresModel[] = [];
  ciudadArray: LugaresModel[] = [];
  fieldTextTypeClave: boolean;
  fieldTextTypeRptClave: boolean;
  muestraSelectCanales: boolean;
  @ViewChild('divTyC') div: ElementRef;
  canales: string[] = [];
  token: string = null;
  auxClave: string = 'atjw=860*';
  maxDate: Date;
  showAge: number;
  menorEdad: boolean;
  isDisabled: boolean = true;
  contrato: contratosDTO = new contratosDTO();
  listContratos: contratosDTO[] = [];
  contratoSeleccionado: contratosDTO = new contratosDTO();

  constructor(private fb: FormBuilder
    , private cookieService: CookieService
    , private ligaService: WSLigaCampeonesService
    , private router: Router
    , private storageService: StorageService
    , private renderer: Renderer2
    , private authTokenService: AuthTokenService
    , public datepipe: DatePipe
    , private admPerfilesService: AdmPerfilesService) {
    this.maxDate = new Date();
  }

  ngOnInit(): void {
    this.cargarContratos();
    this.crearFormulario();
    this.PintarDepartamento();
    this.cargarUsuario();
    this.cargarCanales();
  }

  cargarContratos() {
    this.admPerfilesService.consultarPropiedades(Constantes.NOMBRE_APLICACION, null).subscribe((parametrosEAFResponse: ParametrosEAFResponse) => {
      if (parametrosEAFResponse.cursorparametros.parametros != null) {
        let parametros: parametrosDTO[] = parametrosEAFResponse.cursorparametros.parametros;
        let newParams: string[] = [];
        // const propContratos: any[] = JSON.parse(this.storageService.getValuePropiedad(Constantes.PROP_CONTRATOS).slice(1, -1));
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

  toggleFieldTextTypeClave() {
    this.fieldTextTypeClave = !this.fieldTextTypeClave;
  }

  toggleFieldTextTypeRptClave() {
    this.fieldTextTypeRptClave = !this.fieldTextTypeRptClave;
  }

  muestracanales() {
    this.muestraSelectCanales = this.formaRegistro.get('canal').value != null;
  }

  cargarUsuario() {
    this.usuario.cedula = Number(this.cookieService.get('usuario'));
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.ConsultarUsuario(this.usuario, this.token).subscribe((resp: responseADMUsuarios) => {

        if (resp.codigo == Constantes.CODIGO_EXITOSO && resp.cursorUsuarios.length >= 1) {
          this.listContratos.find(elem => {
            if (elem.name.toUpperCase() == resp.cursorUsuarios[0].tipoContrato.toUpperCase()) {
              this.contratoSeleccionado = elem;
            }
          });
          this.lugaresData.codigoDane = resp.cursorUsuarios[0].idCiudad;
          this.ligaService.ConsultarLugares(this.lugaresData, this.token).subscribe((resp2: RespuestaLugaresModel) => {
            this.PintarCiudad(resp2.lugares[0].departamento);
            let fechaNacimiento = null;
            if (resp.cursorUsuarios[0].fecha_nacimiento) {
              let f = resp.cursorUsuarios[0].fecha_nacimiento.split("/");
              fechaNacimiento = new Date(f[2] + '/' + f[1] + '/' + f[0]);
            }
            this.formaRegistro.reset({
              nombre: resp.cursorUsuarios[0].nombres,
              apellido: resp.cursorUsuarios[0].apellido,
              documento: resp.cursorUsuarios[0].cedula,
              canal: resp.cursorUsuarios[0].canal,
              numeroCelular: resp.cursorUsuarios[0].celular,
              departamento: resp2.lugares[0].departamento,
              ciudad: resp.cursorUsuarios[0].idCiudad,
              direccion: resp.cursorUsuarios[0].direccion,
              barrio: resp.cursorUsuarios[0].barrio,
              FNacimiento: fechaNacimiento,
              correo: resp.cursorUsuarios[0].correo,
              clave: this.auxClave,
              repetirClave: this.auxClave,
              perfil: resp.cursorUsuarios[0].nombrePerfil,
              tipoContrato: resp.cursorUsuarios[0].tipoContrato
            });
            this.muestracanales();
          });
          this.cargarTerminosYCondiciones();
        }
      });
    });

  }

  actualizarUsuario() {
    if (this.formaRegistro.valid) {
      if (!this.calcularEdad()) {
        Swal.fire({
          title: '¿Está seguro?',
          text: `Está seguro que deseas actualizar los datos de ${this.formaRegistro.get('nombre').value}`,
          icon: 'question',
          showCancelButton: true,
          cancelButtonColor: '#f53201',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#3085d6'
        }).then((result) => {
          if (result.isConfirmed) {
            this.CrearModeloUsuario();
            this.authTokenService.authToken().subscribe((resp: Token) => {
              this.token = resp.token
              this.ligaService.ActualizarUsuario(this.usuario, this.token).subscribe((respUsuario: responseADMUsuarios) => {
                if (respUsuario) {
                  if (this.usuario.clave != null && this.usuario.clave != 'undefined') {
                    this.cookieService.set('pass', btoa(this.usuario.clave));
                  }
                  if (this.usuario.celular != null) {
                    this.cookieService.set('celular', this.usuario.celular.toString());
                  }
                  this.router.navigate(['usuario/inicio']);
                } else {
                  Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Ocurrio un error, no se pudo realizar los cambios!'
                  });
                }
              });
            });
          }
        });
      } else {
        Swal.close();
      }
    } else {
      return Object.values(this.formaRegistro.controls).forEach(control => {
        control.markAsTouched();
      });
    }
  }

  PintarDepartamento() {
    this.LugaresModel.departamento = 0;
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.ConsultarLugares(this.LugaresModel, this.token).subscribe((resp: RespuestaLugaresModel) => {
        this.departamentoArray = resp.lugares;
      });
    });
  }

  PintarCiudad(idDepartamento?: number) {
    if (typeof idDepartamento === undefined) {
      this.LugaresModel.departamento = idDepartamento;
    } else {
      this.LugaresModel.departamento = this.formaRegistro.get('departamento').value;
    }
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.ConsultarLugares(this.LugaresModel, this.token).subscribe((resp: RespuestaLugaresModel) => {
        this.ciudadArray = resp.lugares;
      });
    });
  }

  CrearModeloUsuario() {
    this.usuario.nombres = this.formaRegistro.get('nombre').value;
    this.usuario.apellido = this.formaRegistro.get('apellido').value;
    this.usuario.cedula = Number(this.formaRegistro.get('documento').value);
    this.usuario.canal = this.formaRegistro.get('canal').value;
    this.usuario.celular = this.formaRegistro.get('numeroCelular').value;
    this.usuario.idCiudad = Number(this.formaRegistro.get('ciudad').value);
    this.usuario.direccion = this.formaRegistro.get('direccion').value;
    this.usuario.barrio = this.formaRegistro.get('barrio').value;
    this.usuario.fecha_nacimiento = this.datepipe.transform(this.formaRegistro.get('FNacimiento').value, 'dd/MM/yyyy');
    if (this.formaRegistro.get('clave').value != this.auxClave) {
      this.usuario.cambioClave = true;
      this.usuario.clave = this.formaRegistro.get('clave').value;

    } else {
      this.usuario.cambioClave = false;
    }
  }

  // tslint:disable-next-line: typedef 
  crearFormulario() {
    let erNum = new RegExp(Constantes.PATRON_DIGITOS);
    let erMail = new RegExp(Constantes.PATRON_CORREO);
    let erPsw = new RegExp(Constantes.PATRON_PSW);
    this.formaRegistro = this.fb.group({
      nombre: ['', [Validators.required]],
      apellido: ['', Validators.required],
      documento: ['', Validators.required],
      canal: ['', Validators.required],
      numeroCelular: [null, Validators.compose([Validators.required,
      Validators.minLength(Constantes.MIN_LENGTH),
      Validators.maxLength(Constantes.MAX_LENGTH_CEL),
      Validators.pattern(erNum)])],
      departamento: ['', [Validators.required]],
      ciudad: ['', [Validators.required]],
      direccion: ['', Validators.required],
      barrio: ['', Validators.required],
      FNacimiento: ['', Validators.required],
      correo: ['', [Validators.required, Validators.pattern(erMail)]],
      clave: ['', [
        Validators.required,
        Validators.minLength(Number(this.storageService.getValuePropiedad(Constantes.MIN_LENGTH_PSW))),
        Validators.maxLength(Number(this.storageService.getValuePropiedad(Constantes.MAX_LENGTH_PSW))),
        Validators.pattern(erPsw)
      ]],
      repetirClave: ['', Validators.required],
      perfil: ['', null],
      tipoContrato: ['', null]
    });
  }
  /* Los mensajes */
  count_validation_messages = {
    'celular': [
      { type: 'required', message: 'Celular es requerido' },
      { type: 'minlength', message: 'Celular debe contener mínimo 10 digitos' },
      { type: 'maxlength', message: 'Celular debe contener máximo 10 digitos' },
      { type: 'pattern', message: 'Celular debe ser numérico y debe comenzar por 3' }
    ]
  }

  get cambioClave() {
    return this.formaRegistro.get('clave').value != this.auxClave ? true : false;
  }

  get cambioRepClave() {
    return this.formaRegistro.get('repetirClave').value != this.auxClave ? true : false;
  }

  // tslint:disable-next-line: typedef
  get NombreNoValido() {
    return this.formaRegistro.get('nombre').invalid && this.formaRegistro.get('nombre').touched;
  }
  // tslint:disable-next-line: typedef
  get ApellidoNoValido() {
    return this.formaRegistro.get('apellido').invalid && this.formaRegistro.get('apellido').touched;
  }
  // tslint:disable-next-line: typedef
  get DocumentoNoValido() {
    return this.formaRegistro.get('documento').invalid && this.formaRegistro.get('documento').touched;
  }
  // tslint:disable-next-line: typedef
  get CanalNoValido() {
    return this.formaRegistro.get('canal').invalid && this.formaRegistro.get('canal').touched;
  }
  // tslint:disable-next-line: typedef
  get NumeroCelularNoValido() {
    return this.formaRegistro.get('numeroCelular').invalid && this.formaRegistro.get('numeroCelular').touched;
  }
  // tslint:disable-next-line: typedef
  get DepartamentoNoValido() {
    return this.formaRegistro.get('departamento').invalid && this.formaRegistro.get('departamento').touched;
  }
  // tslint:disable-next-line: typedef
  get CiudadNoValido() {
    return this.formaRegistro.get('ciudad').invalid && this.formaRegistro.get('ciudad').touched;
  }
  // tslint:disable-next-line: typedef
  get DireccionNoValido() {
    return this.formaRegistro.get('direccion').invalid && this.formaRegistro.get('direccion').touched;
  }
  // tslint:disable-next-line: typedef
  get BarrioNoValido() {
    return this.formaRegistro.get('barrio').invalid && this.formaRegistro.get('barrio').touched;
  }

  // tslint:disable-next-line: typedef
  get FNacimientoNoValido() {
    if (this.formaRegistro.get('FNacimiento').valid) {
      this.menorEdad = false;
    }
    return this.formaRegistro.get('FNacimiento').invalid && this.formaRegistro.get('FNacimiento').touched;
  }

  // tslint:disable-next-line: typedef
  get CorreoNoValido() {
    return this.formaRegistro.get('correo').invalid && this.formaRegistro.get('correo').touched;
  }
  // tslint:disable-next-line: typedef
  get ClaveNoValido() {
    return this.formaRegistro.get('clave').invalid && this.formaRegistro.get('clave').touched;
  }
  // tslint:disable-next-line: typedef
  get RepetirClaveNoValido() {
    return this.formaRegistro.get('repetirClave').invalid && this.formaRegistro.get('repetirClave').touched ||
      this.formaRegistro.get('repetirClave').value !== this.formaRegistro.get('clave').value;
  }

  cargarTerminosYCondiciones() {
    const p: HTMLParagraphElement = this.renderer.createElement('div');
    p.innerHTML = atob(this.contratoSeleccionado.terminos);
    this.renderer.appendChild(this.div.nativeElement, p);
  }

  calcularEdad() {
    const convertAge = new Date(this.formaRegistro.get('FNacimiento').value);
    const timeDiff = Math.abs(Date.now() - convertAge.getTime());
    this.showAge = Math.floor((timeDiff / (1000 * 3600 * 24)) / 365);
    this.menorEdad = false;
    if (this.showAge < 18) {
      this.formaRegistro.get('FNacimiento').reset();
      this.menorEdad = true;
    }
    return this.menorEdad;
  }
}

