import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { UserModel, usuarioResponseADMUsuarios } from '../../models/user/user.model';
import Swal from 'sweetalert2';
import { WSLigaCampeonesService } from '../../services/wsliga-campeones.service';
import { LugaresModel, RespuestaLugaresModel } from '../../models/lugares/lugares.model';
import { Constantes } from 'src/app/shared/Constantes';
import { StorageService } from '../../services/storage.service';
import { Token } from 'src/app/models/auth/auth.model';
import { AuthTokenService } from 'src/app/services/auth-token.service';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { AppDateAdapter, APP_DATE_FORMATS } from 'src/app/shared/date-format/format-datepicker';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { DatePipe } from '@angular/common'
import { PerfilModel, respuestaPerfilModel } from 'src/app/models/perfil.model';
import { parametrosDTO, ParametrosEAFResponse, contratosDTO } from 'src/app/models/admPerfiles/propiedades.model';
import { CookieService } from 'ngx-cookie-service';
import { AdmPerfilesService } from 'src/app/services/api-adm-perfiles.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  //changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./register.component.css'],
  providers: [
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }
  ]
})
export class RegisterComponent implements OnInit {

  formaRegistro: FormGroup;
  listaDepartamentos: LugaresModel[] = [];
  listaCiudades: LugaresModel[] = [];
  canales: string[] = [];
  mostrarPass = "password";
  cargaCompleta: boolean = false;
  TyC: string;
  @ViewChild('divTyC') div: ElementRef;
  token: string = null;
  maxDate: Date;
  showAge: number;
  menorEdad: boolean;
  contrato: contratosDTO=null;
  listContratos: contratosDTO[] = [];

  constructor(private fb: FormBuilder
    , private route: ActivatedRoute
    , private ligaService: WSLigaCampeonesService
    , private routes: Router
    , private renderer: Renderer2
    , private storageService: StorageService
    , private authTokenService: AuthTokenService
    , public datepipe: DatePipe
    , private cookieService: CookieService    
    , private admPerfilesService: AdmPerfilesService) {
    this.maxDate = new Date();
  }

  ngOnInit(): void {
    this.cargarCanales();
    this.crearFormulario();
    this.cargarDepartamentos();
    this.cargarDataAlFormulario();
    this.cargarContratos();
  }
  getTipoContratoRegistrar() {
    return this.cookieService.get(Constantes.COOKIE_ID_CONTRATO_REGISTRAR);
  }
  getNombrePerfilRegistrar() {
    return this.cookieService.get(Constantes.COOKIE_NOMBRE_PERFIL_REGISTRAR);
  }

  cargarCanales() {
    this.authTokenService.authTokenRegistroNuevo().subscribe((resp: Token) => {
      this.token = resp.token
      let perfil: PerfilModel = new PerfilModel();
      perfil.idPerfil = Number(this.cookieService.get(Constantes.COOKIE_ID_PERFIL_REGISTRAR));
      this.ligaService.consultarPerfiles(perfil, this.token).subscribe((resp: respuestaPerfilModel) => {
        this.canales = resp.listaPerfiles[0].canales!=null? resp.listaPerfiles[0].canales.split(Constantes.SEPARADOR): [];
      });
    });
  }

  cargarContratos() {
    this.admPerfilesService.consultarPropiedades(Constantes.NOMBRE_APLICACION, null).subscribe((parametrosEAFResponse: ParametrosEAFResponse) => {
      if (parametrosEAFResponse.cursorparametros.parametros != null) {
        let parametros: parametrosDTO[] = parametrosEAFResponse.cursorparametros.parametros;
        let newParams: string[] = [];

        const propContratos: any[] = JSON.parse(this.storageService.getValuePropiedad(Constantes.PROP_CONTRATOS));
        propContratos.splice(3, 1);
        parametros.forEach(elem => {
          if (propContratos.some(p => p.nombre === elem.nombre)) {
            newParams.push(elem.valor);
          }
        });
        newParams.forEach(contrato => {
          let item = JSON.parse(contrato.slice(1, -1));
          this.listContratos.push(item);
        });
      }
      this.cargarTerminos();
    });
  }

  cargarTerminos() {
    this.listContratos.find(elem => {
      if (elem.name.toUpperCase() ==this.cookieService.get(Constantes.COOKIE_ID_CONTRATO_REGISTRAR).toUpperCase()) {
        this.contrato = elem;
      }
    });
    if (this.contrato != undefined) {
      const p: HTMLParagraphElement = this.renderer.createElement('div');
      p.innerHTML = atob(this.contrato.terminos);
      this.renderer.appendChild(this.div.nativeElement, p);
    }
  }

  // tslint:disable-next-line: typedef
  guardar() {
    if (!this.formaRegistro.valid) {
      return Object.values(this.formaRegistro.controls).forEach(control => {
        control.markAsTouched();
      });
    }

    if (!this.calcularEdad()) {

      let usuario: UserModel = this.obtenerUsuarioDesdeForm();
      usuario.idPerfil = Number(this.cookieService.get(Constantes.COOKIE_ID_PERFIL_REGISTRAR));
      usuario.tipoContrato = this.cookieService.get(Constantes.COOKIE_ID_CONTRATO_REGISTRAR);
      this.cookieService.set('usuarioEditor',this.formaRegistro.get('nombre').value)

      this.authTokenService.authTokenRegistroNuevo().subscribe((resp: Token) => {
        this.token = resp.token
        this.ligaService.CrearUsuario(usuario, this.token).subscribe(resp => {
          if (resp) {
            Swal.fire({
              title: 'USUARIO REGISTRADO',
              text: 'Ya puedes ingresar con tu documento y contraseña',
              icon: 'success',
              confirmButtonText: 'Aceptar',
              confirmButtonColor: '#f53201'
            });
          }
          this.routes.navigate(['/login']);
        });
      });

    } else {
      Swal.close();
    }
  }

  // tslint:disable-next-line: typedef
  cargarDataAlFormulario() {
    const cedula = this.route.snapshot.paramMap.get('cedula');
    this.formaRegistro.reset({
      documento: cedula
    });

  }

  // tslint:disable-next-line: typedef
  crearFormulario() {
    let erNum = new RegExp(Constantes.PATRON_DIGITOS);
    this.formaRegistro = this.fb.group({
      nombre: [{ value: '' }, [Validators.required]],
      apellido: [{ value: '' }, Validators.required],
      documento: [{ value: '', disabled: true }, Validators.required],
      FNacimiento: ['', Validators.required],
      canal: [{ value: '' }, [Validators.required]],
      numeroCelular: [null, Validators.compose([Validators.required,
      Validators.minLength(Constantes.MIN_LENGTH),
      Validators.maxLength(Constantes.MAX_LENGTH_CEL),
      Validators.pattern(erNum)])],
      departamento: ['', [Validators.required]],
      ciudad: ['', [Validators.required]],
      direccion: ['', Validators.required],
      barrio: ['', Validators.required],
      correo: ['', [Validators.required, Validators.pattern('[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$')]],
      clave: ['', [
        Validators.required,
        Validators.minLength(6), Validators.maxLength(30),
        Validators.pattern('^(?!.*(?:123|abc|ABC|Abc|aBc|abC|ABc|aBC|AbC)).*$')
      ]],
      repetirClave: ['', Validators.required],
      aceptoTerminos: ['', Validators.requiredTrue]
    });
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
  get FNacimientoNoValido() {
    if (this.formaRegistro.get('FNacimiento').valid) {
      this.menorEdad = false;
    }
    return this.formaRegistro.get('FNacimiento').invalid && this.formaRegistro.get('FNacimiento').touched;
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
  // tslint:disable-next-line: typedef
  get AceptoTerminosNovalido() {
    return this.formaRegistro.get('aceptoTerminos').invalid && this.formaRegistro.get('aceptoTerminos').touched;
  }

  cargarDepartamentos() {
    let lugar: LugaresModel = new LugaresModel();
    lugar.departamento = 0;
    this.authTokenService.authTokenRegistroNuevo().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.ConsultarLugares(lugar, this.token).subscribe((resp: RespuestaLugaresModel) => {
        this.listaDepartamentos = resp.lugares;
        this.cargaCompleta = true;
      });
    });
  }

  cargarCiudades(idDepartamento: number) {
    let lugar: LugaresModel = new LugaresModel();
    lugar.departamento = idDepartamento;
    this.authTokenService.authTokenRegistroNuevo().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.ConsultarLugares(lugar, this.token).subscribe((resp: RespuestaLugaresModel) => {
        this.listaCiudades = resp.lugares;
      });
    });
  }
  cargarCiudades2() {
    this.cargarCiudades(this.formaRegistro.get('departamento').value);
  }

  private obtenerUsuarioDesdeForm() {
    return {
      ...new usuarioResponseADMUsuarios(),
      nombres: this.formaRegistro.get('nombre').value,
      apellido: this.formaRegistro.get('apellido').value,
      cedula: this.formaRegistro.get('documento').value,
      fecha_nacimiento: this.datepipe.transform(this.formaRegistro.get('FNacimiento').value, 'dd/MM/yyyy'),
      canal: this.formaRegistro.get('canal').value,
      celular: this.formaRegistro.get('numeroCelular').value,
      idCiudad: this.formaRegistro.get('ciudad').value,
      direccion: this.formaRegistro.get('direccion').value,
      barrio: this.formaRegistro.get('barrio').value,
      correo: this.formaRegistro.get('correo').value,
      clave: this.formaRegistro.get('clave').value
    };
  }
  count_validation_messages = {
    'celular': [
      { type: 'required', message: 'Celular es requerido' },
      { type: 'minlength', message: 'Celular debe contener mínimo 10 digitos' },
      { type: 'maxlength', message: 'Celular debe contener máximo 10 digitos' },
      { type: 'pattern', message: 'Celular debe ser numérico y debe comenzar por 3' }
    ]
  }


  validarError(nombreCampo: string, tipoError: any) {
    return this.formaRegistro.get(nombreCampo).hasError(tipoError)
      && (this.formaRegistro.get(nombreCampo).dirty || this.formaRegistro.get(nombreCampo).touched);
  }

  mostrarPassword() {
    this.mostrarPass = (this.mostrarPass == "password") ? "text" : "password";
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
