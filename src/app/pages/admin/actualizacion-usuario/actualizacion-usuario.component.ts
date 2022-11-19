import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';
import { UserModel, RequestDescargaHistoricoUsuario, responseADMUsuarios, usuarioResponseADMUsuarios } from '../../../models/user/user.model';
import Swal from 'sweetalert2';
import { WSLigaCampeonesService } from '../../../services/wsliga-campeones.service';
import { LugaresModel, RespuestaLugaresModel } from '../../../models/lugares/lugares.model';
import { Constantes } from 'src/app/shared/Constantes';
import * as FileSaver from 'file-saver';
import { StorageService } from 'src/app/services/storage.service';
import { GeneralService } from 'src/app/services/api-ser-general.service';
import { Token } from 'src/app/models/auth/auth.model';
import { AuthTokenService } from 'src/app/services/auth-token.service';
import { CookieService } from 'ngx-cookie-service';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { AppDateAdapter, APP_DATE_FORMATS } from 'src/app/shared/date-format/format-datepicker';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { DatePipe } from '@angular/common'
import { PerfilModel, respuestaPerfilModel } from 'src/app/models/perfil.model';
import { contratosDTO, parametrosDTO, ParametrosEAFResponse } from 'src/app/models/admPerfiles/propiedades.model';
import { AdmPerfilesService } from 'src/app/services/api-adm-perfiles.service';

@Component({
  selector: 'app-actualizacion-usuario',
  templateUrl: './actualizacion-usuario.component.html',
  styleUrls: ['./actualizacion-usuario.component.css'],
  providers: [
    { provide: DateAdapter, useClass: AppDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' }
  ]
})
export class ActualizacionUsuarioComponent implements OnInit {

  formaUsuario: FormGroup;
  user: UserModel = new UserModel();
  isDisabled:boolean=true;
  lugaresData: LugaresModel = new LugaresModel();//objeto para consultar informacion
  departamentoArray: LugaresModel[] = [];
  ciudadArray: LugaresModel[] = [];
  canales: string[] = [];
  cedulaConsultada: number;
  cargaCompleta = false;
  TyC: string;
  @ViewChild('divTyC') div: ElementRef;
  token: string = null;
  // auxAdmin: boolean = false;
  auxClave: string = 'atjw=860*';
  auxMgs: boolean = false;
  maxDate: Date;
  showAge: number;
  menorEdad: boolean;
  fieldTextTypeClave: boolean;
  fieldTextTypeRptClave: boolean;
  display: boolean = true;
  formFechas: FormGroup;
  minDate: Date;
  maxDateFecha: Date;
  isActive: boolean = false;
  lstEstado: string[] = [];
  idPerfilConsultado :number;
  contrato: contratosDTO = new contratosDTO();
  listContratos: contratosDTO[] = [];
  contratoSeleccionado: contratosDTO = new contratosDTO();
  
  constructor(private fb: FormBuilder
    , private formBuilderDate: FormBuilder
    , private cookieService: CookieService
    , private storageService: StorageService
    , private generalService: GeneralService
    , private ligaService: WSLigaCampeonesService
    , private route: ActivatedRoute
    , private routes: Router
    , private renderer: Renderer2
    , private authTokenService: AuthTokenService
    , private admPerfilesService: AdmPerfilesService
    , public datepipe: DatePipe) {
    this.maxDate = new Date();
    const currentYear = new Date().getFullYear();
    this.minDate = new Date(currentYear - 100, 0, 1);
    this.maxDateFecha = new Date();
    this.formFechas = this.formBuilderDate.group({
      fechaInicio: [null],
      fechaFin: [null],
      activoReport: [null]
    });
  }

  ngOnInit(): void {
    let estado = Constantes.CONST_LISTADO_ESTADOS
    this.lstEstado=estado.split(',');
    this.crearFormulario();
    this.PintarDepartamento();
    
    this.formaUsuario.controls['activo'].disable();
    
    //usuario que se va a editar
    const cedula = this.route.snapshot.paramMap.get('id');
    this.cedulaConsultada = Number(cedula.valueOf().replace(':', ''));
    this.ConsultarUsario(this.cedulaConsultada);
    
  }

  toggleFieldTextTypeClave() {
    this.fieldTextTypeClave = !this.fieldTextTypeClave;
  }
  toggleFieldTextTypeRptClave() {
    this.fieldTextTypeRptClave = !this.fieldTextTypeRptClave;
  }


    
  cargarCanales() {
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      let perfil: PerfilModel =  new PerfilModel();
      perfil.idPerfil = this.idPerfilConsultado;
          this.ligaService.consultarPerfiles(perfil, this.token).subscribe((resp: respuestaPerfilModel) => {
            this.canales = resp.listaPerfiles[0].canales.split(Constantes.SEPARADOR);
          });
      });
    }
  

  PintarDepartamento() {
    let lugar: LugaresModel = new LugaresModel();
    lugar.departamento = 0;
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.ConsultarLugares(lugar, this.token).subscribe((resp: RespuestaLugaresModel) => {
        this.departamentoArray = resp.lugares;
      });
    });
  }

  
  
  ConsultarUsario(cedula: number) {
    Swal.fire({
      text: 'Cargando',
      allowOutsideClick: false
    });
    Swal.showLoading();
    this.user.cedula = cedula;
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.ConsultarUsuario(this.user, this.token).subscribe((responseUsuario: responseADMUsuarios) => {
        Swal.close();
        if (responseUsuario.codigo != Constantes.CODIGO_EXITOSO || null == responseUsuario.cursorUsuarios) {
          this.generalService.mostrarMensaje("Error", "No fue posible consultar la informacion en liga de campeones", "error");
          return;
        }

        let cursorAux = responseUsuario.cursorUsuarios.filter(function (e) { return (Number(e.cedula) == cedula); });
        if (cursorAux.length == 0) {
          this.generalService.mostrarMensaje("Oops...", "Al verificar la cédula encontramos que no apareces registrado.", "error");
          this.routes.navigate([`/administrador/consultarInformacion/`]);
          return;
        }
        this.idPerfilConsultado = cursorAux[0].idPerfil;
        this.cargarCanales();

        this.lugaresData.codigoDane = cursorAux[0].idCiudad;
        //se consulta el departamento de la ciudad del usuario
        this.ligaService.ConsultarLugares(this.lugaresData, this.token).subscribe((responseDepartamento: RespuestaLugaresModel) => {
          if (responseDepartamento.codigo == Constantes.CODIGO_EXITOSO && responseDepartamento.lugares.length > 0) {
            //se cargan las ciudades referentes al departamento
            this.cargarCiudades(responseDepartamento.lugares[0].departamento);
            this.enviarUsuarioAFormulario(cursorAux[0], responseDepartamento.lugares[0].departamento);
            this.cargaCompleta = true;
            Swal.close();
          }
        });
      });//fin consulta usuario
    });
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
      this.cargarTerminosYCondiciones();
    });
  }

  cargarTerminosYCondiciones() {
    this.listContratos.find(elem => {
      if (elem.name.toUpperCase() == this.formaUsuario.get('tipoContrato').value.toUpperCase()) {
        this.contratoSeleccionado = elem;
      }
    });
    if(this.cookieService.get(Constantes.PROP_TIPO_CONTRATO_LOGIN)==''){
      const p: HTMLParagraphElement = this.renderer.createElement('div');
      p.innerHTML = atob(this.listContratos[3].terminos);
      this.renderer.appendChild(this.div.nativeElement, p);
      return;
    }
    const p: HTMLParagraphElement = this.renderer.createElement('div');
    p.innerHTML = atob(this.contratoSeleccionado.terminos);
    this.renderer.appendChild(this.div.nativeElement, p);
  }

  getDepartamento() {
    return Number(this.formaUsuario.get('departamento').value);
  }
  enviarUsuarioAFormulario(user: usuarioResponseADMUsuarios, idDep) {
    let fechaNacimiento = null;
    if (user.fecha_nacimiento) {
      let f = user.fecha_nacimiento.split("/");
      fechaNacimiento = new Date(f[2] + '/' + f[1] + '/' + f[0]);
    }
    this.formaUsuario.reset({
      activo:  (user.activo == 0) ? true: false,
      nombres: user.nombres,
      apellido: user.apellido,
      cedula: user.cedula,
      FNacimiento: fechaNacimiento,
      canal: user.canal,
      celular: user.celular,
      departamento: idDep,
      idCiudad: user.idCiudad,
      direccion: user.direccion,
      barrio: user.barrio,
      correo: user.correo,
      clave: this.auxClave,
      repetirClave: this.auxClave,
      perfil:user.nombrePerfil,
      tipoContrato: user.tipoContrato
    });
    this.cargarContratos();
  }
  get cambioClave() {
    return this.formaUsuario.get('clave').value != this.auxClave ? true : false;
  }

  get cambioRepClave() {
    return this.formaUsuario.get('repetirClave').value != this.auxClave ? true : false;
  }

  // tslint:disable-next-line: typedef
  get NombreNoValido() {
    return this.formaUsuario.get('nombres').invalid && this.formaUsuario.get('nombres').touched;
  }
  // tslint:disable-next-line: typedef
  get ApellidoNoValido() {
    return this.formaUsuario.get('apellido').invalid && this.formaUsuario.get('apellido').touched;
  }
  // tslint:disable-next-line: typedef
  get DocumentoNoValido() {
    return this.formaUsuario.get('cedula').invalid && this.formaUsuario.get('cedula').touched;
  }

  // tslint:disable-next-line: typedef
  get FNacimientoNoValido() {
    if (this.formaUsuario.get('FNacimiento').valid) {
      this.menorEdad = false;
    }
    return this.formaUsuario.get('FNacimiento').invalid && this.formaUsuario.get('FNacimiento').touched;
  }
  // tslint:disable-next-line: typedef
  get CanalNoValido() {
    return this.formaUsuario.get('canal').invalid && this.formaUsuario.get('canal').touched;
  }
  // tslint:disable-next-line: typedef
  get NumeroCelularNoValido() {
    return this.formaUsuario.get('celular').invalid && this.formaUsuario.get('celular').touched;
  }
  // tslint:disable-next-line: typedef
  get DepartamentoNoValido() {
    return this.formaUsuario.get('departamento').invalid && this.formaUsuario.get('departamento').touched;
  }
  // tslint:disable-next-line: typedef
  get CiudadNoValido() {
    return this.formaUsuario.get('idCiudad').invalid && this.formaUsuario.get('idCiudad').touched;
  }
  // tslint:disable-next-line: typedef
  get DireccionNoValido() {
    return this.formaUsuario.get('direccion').invalid && this.formaUsuario.get('direccion').touched;
  }
  // tslint:disable-next-line: typedef
  get BarrioNoValido() {
    return this.formaUsuario.get('barrio').invalid && this.formaUsuario.get('barrio').touched;
  }
  // tslint:disable-next-line: typedef
  get CorreoNoValido() {
    return this.formaUsuario.get('correo').invalid && this.formaUsuario.get('correo').touched;
  }
  // tslint:disable-next-line: typedef
  get ClaveNoValido() {
    return this.formaUsuario.get('clave').invalid && this.formaUsuario.get('clave').touched;
  }
  // tslint:disable-next-line: typedef
  get RepetirClaveNoValido() {
    return this.formaUsuario.get('repetirClave').invalid && this.formaUsuario.get('repetirClave').touched ||
      this.formaUsuario.get('repetirClave').value !== this.formaUsuario.get('clave').value;
  }
  
  crearFormulario() {
    let er = new RegExp(Constantes.PATRON_DIGITOS);
    this.formaUsuario = this.fb.group({
      nombres: ['', [Validators.required]],
      apellido: ['', Validators.required],
      cedula: ['', Validators.required],
      FNacimiento: ['', Validators.required],
      canal: ['', [Validators.required]],
      celular: ['', [
        Validators.required,
        Validators.maxLength(Constantes.MAX_LENGTH_CEL),
        Validators.minLength(Constantes.MIN_LENGTH),
        Validators.pattern(er)]],
      departamento: ['', [Validators.required]],
      idCiudad: ['', [Validators.required]],
      direccion: ['', Validators.required],
      barrio: ['', Validators.required],
      correo: ['', [Validators.required, Validators.pattern('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,3}$')]],
      clave: ['', [
        Validators.required,
        Validators.minLength(6), Validators.maxLength(30),
        Validators.pattern('^(?!.*(?:123|abc|ABC|Abc|aBc|abC|ABc|aBC|AbC)).*$')
      ]],
      repetirClave: ['', Validators.required],
      // administrador: ['', [Validators.required]],
      activo: ['',null],
      perfil:['',null],
      tipoContrato:['',null]

    });
  }

  guardar() {
    if (this.formaUsuario.valid) {
      if (!this.calcularEdad()) {
        Swal.fire({
          title: '¿Estás seguro?',
          text: 'que deseas actualizar a ' + this.formaUsuario.get('nombres').value,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#f53201',
          confirmButtonText: 'Aceptar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.obtenerUsuarioDeFormulario();
            this.authTokenService.authToken().subscribe((resp: Token) => {
              this.token = resp.token
              this.ligaService.ActualizarUsuario(this.user, this.token).subscribe((resp: responseADMUsuarios) => {

                if (resp && resp.codigo != Constantes.CODIGO_EXITOSO) {
                  this.generalService.mostrarMensaje("Error", resp.resultado, "error");
                } else if (resp && resp.codigo == Constantes.CODIGO_EXITOSO && resp.cursorUsuarios.length > 0) {

                  if (this.user.cedula.toString() == atob(this.cookieService.get('user'))) {
                    if (this.user.clave != null && this.user.clave != 'undefined') {
                      this.cookieService.set('pass', btoa(this.user.clave));
                    }
                    if (this.user.celular != null) {
                      this.cookieService.set('celular', this.user.celular.toString());
                    }
                  }
                  Swal.fire({
                    icon: 'success',
                    title: 'Exitoso',
                    text: 'Usuario actualizado',
                    confirmButtonColor: '#f53201'
                  });
                  // location.reload();
                  return;
                }
              });
            });
          }
        });

      } else {
        Swal.close();
      }
    } else {
      return Object.values(this.formaUsuario.controls).forEach(control => {
        control.markAsTouched();
      });
    }
  }


  obtenerUsuarioDeFormulario() {
    this.user.nombres = this.formaUsuario.get('nombres').value;
    this.user.apellido = this.formaUsuario.get('apellido').value;
    this.user.cedula = Number(this.formaUsuario.get('cedula').value);
    this.user.fecha_nacimiento = this.datepipe.transform(this.formaUsuario.get('FNacimiento').value, 'dd/MM/yyyy'),
    this.user.canal = this.formaUsuario.get('canal').value;
    this.user.celular = this.formaUsuario.get('celular').value;
    this.user.idCiudad = Number(this.formaUsuario.get('idCiudad').value);
    this.user.direccion = this.formaUsuario.get('direccion').value;
    this.user.barrio = this.formaUsuario.get('barrio').value;
    this.user.correo = this.formaUsuario.get('correo').value;
    if (this.formaUsuario.get('clave').value != this.auxClave) {
      this.user.cambioClave = true;
      this.user.clave = this.formaUsuario.get('clave').value;
    } else {
      this.user.cambioClave = false;
    }
  }

  cargarCiudades(idDepartamento: number) {
    let lugar: LugaresModel = new LugaresModel();
    lugar.departamento = idDepartamento;
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.ConsultarLugares(lugar, this.token).subscribe((resp: RespuestaLugaresModel) => {
        this.ciudadArray = resp.lugares;
      });
    });
  }

  getCedula() {
    return this.formaUsuario.get("cedula").value;
  }
  getPerfil(){
    return this.formaUsuario.get("perfil").value;
  }

  getTipoContrato(){
    return this.formaUsuario.get("tipoContrato").value;
  }

  dercargarHistoricoUsuario(dateForm: any) {
    Swal.fire({
      text: 'Descargando',
      allowOutsideClick: false
    });
    Swal.showLoading();
    let request = new RequestDescargaHistoricoUsuario();
    request.cedulaEditada = this.getCedula();
    if (dateForm.fechaInicio && dateForm.fechaFin) {
    let fechaInicio = dateForm.fechaInicio.getFullYear() + "/" + (dateForm.fechaInicio.getMonth() + 1) + "/" + dateForm.fechaInicio.getDate().toString() ;
    let fechaFin =  dateForm.fechaFin.getFullYear() + "/" +(dateForm.fechaFin.getMonth() + 1) + "/" + dateForm.fechaFin.getDate().toString();
    let start_date =this.datepipe.transform(fechaInicio, 'yyyy/MM/dd');
    let latest_date =this.datepipe.transform(fechaFin, 'yyyy/MM/dd');
    request.fechaInEdicion = start_date;
    request.fechaFinEdicion = latest_date;
    }
    if(dateForm.activoReport){
      if(dateForm.activoReport=='Activo'){
        request.activo=0;
      }
      else{
        request.activo=1;
      }
    }
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.decargarHistoricoUsuario(request, this.token).subscribe(resp => {
        let blob: any = new Blob([resp], { type: Constantes.TIPO_ARCHIVO_EXCEL });
        FileSaver.saveAs(blob, "HISTORICO_USUARIO_" + request.cedulaEditada);
        Swal.close();
      });
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

  validarError(nombreCampo: string, tipoError: any) {
    return this.formaUsuario.get(nombreCampo).hasError(tipoError)
      && (this.formaUsuario.get(nombreCampo).dirty || this.formaUsuario.get(nombreCampo).touched);
  }

  calcularEdad() {
    const convertAge = new Date(this.formaUsuario.get('FNacimiento').value);
    const timeDiff = Math.abs(Date.now() - convertAge.getTime());
    this.showAge = Math.floor((timeDiff / (1000 * 3600 * 24)) / 365);
    this.menorEdad = false;
    if (this.showAge < 18) {
      this.formaUsuario.get('FNacimiento').reset();
      this.menorEdad = true;
    }
    return this.menorEdad;
  }
  limpiarForm(dateForm: any){
    this.formFechas.reset();
  }
}