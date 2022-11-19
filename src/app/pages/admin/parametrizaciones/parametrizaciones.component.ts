import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { GeneralService } from 'src/app/services/api-ser-general.service';
import Swal from 'sweetalert2';
import { ThemePalette } from '@angular/material/core';
import { StorageService } from 'src/app/services/storage.service';
import { Constantes } from 'src/app/shared/Constantes';
import { cursorContratos, imagenesDTO, parametrosDTO, ParametrosEAFResponse, contratosDTO, correosDTO, cursorCorreos } from 'src/app/models/admPerfiles/propiedades.model';
import { AdmPerfilesService } from 'src/app/services/api-adm-perfiles.service';
import { Form, FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from 'src/app/shared/dialogo/dialog/dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { DataStorageByStatesService } from 'src/app/services/data-storage-by-states.service';


@Component({
  selector: 'parametrizaciones',
  templateUrl: './parametrizaciones.component.html',
  styleUrls: ['./parametrizaciones.component.css']
})
export class ParametrizacionesComponent implements OnInit {

  //CONFIGURACION DE MENSAJES DE PQR
  listaMensajesPQR = [];
  formularioDinamicoPQRForm: FormGroup;
  cargueCompletoPQR: boolean = false;
  //CONFIGURACION DE TIPO DE SOLICITUD PQR
  listaTipoSolicitudPQR = [];
  tipoSolicitudPqrsForm: FormGroup;

  previewInicio: string;
  previewNewBanner: string = null;
  previewBanners = new Array();
  btnGuardarIn: boolean = false;
  btnGuardarBan: number = null;
  estPolitica: boolean = false;
  estComponente: boolean = false;
  titPolitica: string = null;
  politica: string = null;
  politicaForm: FormGroup;
  formCorreo: FormGroup;

  contactanosForm: FormGroup;
  componenteFlotanteForm: FormGroup;
  diasInactUsuarioForm: FormGroup;
  tycForm: FormGroup;
  vencimientoXInactivacionForm: FormGroup;

  //Propiedades de correo modificadas
  listaPropiedadesModficadas: Array<Number>;
  texto: string;
  nombreComponenteFlotante: string;
  diasInactivacionComponente: number;
  numeroCantRespuestasPqrs: number;
  diasVencimientoPqrs: number;
  urlComponenteFlotante: string;
  textoTyC: string;
  correo: string;
  color: ThemePalette = 'warn';
  btnNewBanner: boolean = false;
  msgBanner: boolean = false;
  viewComponent: boolean = false;
  @Output() onChange: EventEmitter<File> = new EventEmitter<File>();
  dataSourceTerminos = new MatTableDataSource<contratosDTO>();
  selection = new SelectionModel<contratosDTO>();
  ColumnsTerminos: string[] = ['nombre', 'descripcion', 'Accion'];

  dataSourceCorreoPqrs = new MatTableDataSource<correosDTO>();
  selectionCorreo = new SelectionModel<correosDTO>(true, []);
  ColumnsCorreos: string[] = ['Nombre', 'Estructura', 'Accion'];

  dataSourceImagenes = new MatTableDataSource<imagenesDTO>();
  selectionImagenes = new SelectionModel<imagenesDTO>();
  ColumnsImagenes: string[] = ['nombre', 'descripcion', 'img', 'Accion'];

  dataSourceImagenesBanner = new MatTableDataSource<imagenesDTO>();
  selectionImagenBanner = new SelectionModel<imagenesDTO>();
  ColumnsImagenBanner: string[] = ['nombre', 'descripcion', 'img', 'Accion'];

  lstTerminos: cursorContratos = new cursorContratos();
  terminos: contratosDTO = new contratosDTO();
  terminosSeleccionado: contratosDTO = new contratosDTO();

  correoObj: correosDTO = new correosDTO();
  lstCorreo: cursorCorreos = new cursorCorreos();
  recipient: string = '';
  body: string = '';
  subject: string = '';
  step = 0;

  setStep(index: number) {
    this.step = index;
  }

  nextStep() {
    this.step++;
  }

  prevStep() {
    this.step--;
  }

  constructor(private sanitizer: DomSanitizer
    , private generalService: GeneralService
    , private admPerfilesService: AdmPerfilesService
    , private storageService: StorageService
    , public dialog: MatDialog
    , private pv: FormBuilder
    , private concat: FormBuilder
    , private tyc: FormBuilder
    , private floatComponent: FormBuilder
    , private inactivacionUsuario: FormBuilder
    , private vencimientoXInactivacion: FormBuilder
    , private correoFB: FormBuilder
    , private dataStorage: DataStorageByStatesService
    , private fb: FormBuilder) {

    this.politicaForm = this.pv.group({
      estadoPolitica: [null],
      tituloPolitica: [null, [Validators.required]],
      politica: [null, [Validators.required]],
    });

    this.contactanosForm = this.concat.group({
      texto: [null, [Validators.required]],
      correo: [null, [Validators.required]],
    });

    this.formCorreo = this.correoFB.group({
      Nombre: ['', null],
      Estructura: this.correoFB.array([])
    });

    this.componenteFlotanteForm = this.floatComponent.group({
      estadoComponenteFlotante: [null],
      nombreComponenteFlotante: [null, [Validators.required]],
      urlComponenteFlotante: [null, [Validators.required]],
    });

    this.diasInactUsuarioForm = this.inactivacionUsuario.group({
      diasInactivacionComponente: [null, [Validators.required]]
    });

    this.tycForm = this.tyc.group({
      texto: [null, [Validators.required]]
    });

    this.vencimientoXInactivacionForm = this.vencimientoXInactivacion.group({
      inputEstadoVencimiento: [null]
    });
  }

  ngOnInit(): void {
    this.listaPropiedadesModficadas = new Array();
    this.cargarContratos();
    this.getImagenBanner();
    this.getImagenInicio();
    this.getPoliticas();
    this.getContactenos();
    this.getComponenteFlotante();
    this.getUsuarioInact();
    this.escucharModificacionDeCorreo();
    this.configuracionControlPQR();
    this.configuracionTipoSolicitudPQR();
    this.getEstadoVencimiento();
  }

  addControlFormArray(value: any) {
    const control = <FormArray>this.formCorreo.get('Estructura');
    let itemControl = new FormControl();
    let claves = Object.keys(value);
    let values = Object.values(value);
    for (let i = 0; i < claves.length; i++) {
      let clave = values[i];
      itemControl.setValue(clave);
      control.push((itemControl));
    }
  }

  escucharModificacionDeCorreo() {
    const controles = <FormArray>this.formCorreo.controls['Estructura'];
    for (let index = 0; index < controles.length - 1; index++) {
      this.formCorreo.controls['Estructura'].get(index.toString()).valueChanges.subscribe(valorControl => {
        if (valorControl) {
          console.log(this.lstCorreo.correos[index].structure);
        }
      });
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
          this.terminos = JSON.parse(contrato.slice(1, -1));
          this.lstTerminos.contratos.push(this.terminos);
        });
        this.dataSourceTerminos = new MatTableDataSource<contratosDTO>(this.lstTerminos.contratos);
      }
    });
  }

  cargarTerminos(id: any) {
    this.getTyC(id);
    this.terminosSeleccionado.id = id;
    this.terminosSeleccionado.name = this.lstTerminos.contratos[id].name;
    this.terminosSeleccionado.desc = this.lstTerminos.contratos[id].desc;
    this.terminosSeleccionado.terminos = this.lstTerminos.contratos[id].terminos;
  }

  getImagenInicio() {

    const imgBannerInicio = this.storageService.getValuePropiedad(Constantes.INICIO_IMG);
    let ImagenArray: Array<imagenesDTO> = [
      {
        codapp: Constantes.NOMBRE_APLICACION,
        nombre: 'Imagen de Inicio:',
        descripcion: 'Ubicada como fondo del formulario de ingreso a Liga de Campeones.',
        img: imgBannerInicio
      }
    ];
    this.dataSourceImagenes = new MatTableDataSource<imagenesDTO>(ImagenArray);
  }

  getImagenBanner() {
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
    let numImg: number = Number(this.storageService.getValuePropiedad(Constantes.CANTIDAD_IMG));
    this.previewBanners = new Array(numImg);
    let posicion: number;
    this.admPerfilesService.consultarPropiedades(Constantes.NOMBRE_APLICACION_BANNER, null).subscribe((parametrosEAFResponse: ParametrosEAFResponse) => {
      if (parametrosEAFResponse.cursorparametros.parametros != null) {
        let parametrosBanner: parametrosDTO[] = parametrosEAFResponse.cursorparametros.parametros;
        parametrosBanner.forEach(element => {
          posicion = Number(element.nombre.substring(element.nombre.length - 1));
          this.previewBanners[posicion] = element.valor;
        });
        for (let index = 0; index < this.previewBanners.length; index++) {
          if (this.previewBanners[index] == null) {
            this.btnNewBanner = true;
          }
        }
        this.msgBanner = (!this.btnNewBanner) ? true : false
      }
      this.viewComponent = true;
      Swal.close();
    });
  }

  getPoliticas() {
    this.estPolitica = JSON.parse(this.storageService.getValuePropiedad(Constantes.ESTADO_POLITICAS_VIGENTES));
    this.titPolitica = this.storageService.getValuePropiedad(Constantes.TITULO_POLITICAS_VIGENTES);
    this.politica = this.storageService.getValuePropiedad(Constantes.POLITICAS_VIGENTES);
    this.politicaForm.get('estadoPolitica').setValue(this.estPolitica, { onlySelf: true })
    this.politicaForm.get('tituloPolitica').setValue(this.titPolitica, { onlySelf: true })
    this.politicaForm.get('politica').setValue(this.politica, { onlySelf: true })
  }

  getContactenos() {
    this.texto = this.storageService.getValuePropiedad(Constantes.TEXTO_CONTACTENOS);
    this.correo = this.storageService.getValuePropiedad(Constantes.CORREO_CONTACTENOS);
    this.contactanosForm.get('texto').setValue(this.texto, { onlySelf: true })
    this.contactanosForm.get('correo').setValue(this.correo, { onlySelf: true })
  }

  getTyC(id: number) {
    this.textoTyC = atob(this.lstTerminos.contratos[id].terminos);
    this.tycForm.get('texto').setValue(this.textoTyC, { onlySelf: true })
  }

  getEstadoVencimiento() {
    let estado = this.storageService.getValuePropiedad(Constantes.PROP_ACTIVACION_VENCIMIENTO);
    this.vencimientoXInactivacionForm.get('inputEstadoVencimiento').setValue(estado, { onlySelf: true });
  }

  getComponenteFlotante() {
    this.estComponente = JSON.parse(this.storageService.getValuePropiedad(Constantes.PROP_COMPONENTE_ESTADO));
    this.nombreComponenteFlotante = this.storageService.getValuePropiedad(Constantes.PROP_COMPONENTE_FLOTANTE_NAME);
    this.urlComponenteFlotante = this.storageService.getValuePropiedad(Constantes.PROP_COMPONENTE_FLOTANTE_URL);
    this.componenteFlotanteForm.get('estadoComponenteFlotante').setValue(this.estComponente, { onlySelf: true });
    this.componenteFlotanteForm.get('nombreComponenteFlotante').setValue(this.nombreComponenteFlotante, { onlySelf: true });
    this.componenteFlotanteForm.get('urlComponenteFlotante').setValue(this.urlComponenteFlotante, { onlySelf: true });
  }
  getUsuarioInact() {
    this.diasInactivacionComponente = Number(this.storageService.getValuePropiedad(Constantes.PROP_INACT_USUARIO));
    this.diasInactUsuarioForm.get('diasInactivacionComponente').setValue(this.diasInactivacionComponente, { onlySelf: true });
  }

  updateImgInicio(event) {
    const imgCapturada = event.target.files[0];
    this.getBase64(imgCapturada).then((imagen: any) => {
      this.previewInicio = imagen.base;
      this.btnGuardarIn = true;
    })
  }

  updateImgNewBanner(event) {
    const imgCapturada = event.target.files[0];
    this.getBase64(imgCapturada).then((imagen: any) => {
      this.previewNewBanner = imagen.base;
    })
  }

  updateImgBanner(event, valor: number) {
    this.btnGuardarBan = null;
    const imgCapturada = event.target.files[0];
    this.getBase64(imgCapturada).then((imagen: any) => {
      this.previewBanners[valor] = imagen.base;
      this.btnGuardarBan = valor + 1;
    })
  }

  getBase64 = async ($event: any) => new Promise((resolve, reject) => {
    try {
      const unsafeImg = window.URL.createObjectURL($event);
      const image = this.sanitizer.bypassSecurityTrustUrl(unsafeImg);
      const reader = new FileReader();
      reader.readAsDataURL($event);
      reader.onload = () => {
        resolve({
          base: reader.result
        });
      };
      reader.onerror = error => {
        resolve({
          base: null
        });
      };
    } catch (e) {
      return null;
    }
  })


  guardarImagenInicio() {
    
        let parametros = new parametrosDTO;
        parametros.codapp = Constantes.NOMBRE_APLICACION;
        parametros.nombre = Constantes.INICIO_IMG;
        parametros.valor = this.previewInicio;
        this.admPerfilesService.guardarPropiedad(parametros);

      }
  
      guardarImagenBannerNew() {
    const dialogActualizar = this.dialog.open(DialogComponent, {
      data: '¿Desea guardar nueva Imagen de Banner?'
    });
    dialogActualizar.afterClosed().subscribe(res => {
      if (res) {
        Swal.fire({
          text: 'Cargando Información',
          allowOutsideClick: false
        });
        Swal.showLoading();
        let posc: number;
        for (let index = 0; index < this.previewBanners.length; index++) {
          if (this.previewBanners[index] == null) {
            posc = index;
            break
          }
        }
        let parametrosImagen = new parametrosDTO;
        parametrosImagen.codapp = Constantes.NOMBRE_APLICACION_BANNER;
        parametrosImagen.valor = this.previewNewBanner;
        let img = Constantes.BANNER_IMG + "_" + posc;
        parametrosImagen.nombre = img;
        this.admPerfilesService.crearPropiedad(parametrosImagen).subscribe((parametrosEAFResponse: ParametrosEAFResponse) => {
          if (parametrosEAFResponse.codigo == Constantes.CODIGO_EXITOSO) {
            this.btnGuardarBan = null;
            this.btnNewBanner = false;
            this.previewBanners[posc] = this.previewNewBanner;
            this.previewNewBanner = null;
            for (let index = 0; index < this.previewBanners.length; index++) {
              if (this.previewBanners[index] == null) {
                this.btnNewBanner = true;
              }
            }
            this.msgBanner = (!this.btnNewBanner) ? true : false
            Swal.close();
            this.generalService.mostrarMensaje('Success', parametrosEAFResponse.descripcion, 'success');
            return;
          } else {
            Swal.close();
            this.generalService.mostrarMensaje('Success', parametrosEAFResponse.descripcion, 'error');
            return;
          }
        });
      }
    }),
      error => {
        if (error) {
          console.log(error);
        }
      }
  }


  actualizarImagenBanner(valor: string, posc: number) {
    let parametros = new parametrosDTO;
    parametros.codapp = Constantes.NOMBRE_APLICACION_BANNER;
    parametros.valor = valor;
    parametros.nombre = Constantes.BANNER_IMG + "_" + posc;
    this.admPerfilesService.guardarPropiedad(parametros);
  }

  EliminarImagenBanner(valor: string, posc: number) {
    const dialogActualizar = this.dialog.open(DialogComponent, {
      data: '¿Desea Eliminar Imagen de Banner?'
    });
    dialogActualizar.afterClosed().subscribe(res => {
      if (res) {
        Swal.fire({
          text: 'Cargando Información',
          allowOutsideClick: false
        });
        Swal.showLoading();
        let parametros = new parametrosDTO;
        parametros.codapp = Constantes.NOMBRE_APLICACION_BANNER;
        parametros.valor = valor;
        let img = Constantes.BANNER_IMG + "_" + posc;
        parametros.nombre = img;
        this.admPerfilesService.EliminarPropiedad(parametros).subscribe((parametrosEAFResponse: ParametrosEAFResponse) => {
          if (parametrosEAFResponse.codigo == Constantes.CODIGO_EXITOSO) {
            this.btnGuardarBan = null;
            this.btnNewBanner = false;
            this.previewBanners[posc] = null;
            for (let index = 0; index < this.previewBanners.length; index++) {
              if (this.previewBanners[index] == null) {
                this.btnNewBanner = true;
              }
            }
            this.msgBanner = (!this.btnNewBanner) ? true : false
            this.generalService.mostrarMensaje('Success', parametrosEAFResponse.descripcion, 'success');
            return;
          } else {
            Swal.close();
            this.generalService.mostrarMensaje('Success', parametrosEAFResponse.descripcion, 'error');
            return;
          }
        });
      }
    }),
      error => {
        if (error) {
          console.log(error);
        }
      }
  }

  limpiarForm(value: any) {
    if (value == 0) {
      this.politicaForm.reset();
    } else if (value == 1) {
      this.contactanosForm.reset();
    } else if (value == 2) {
      this.tycForm.reset();
    }
    else {
      this.componenteFlotanteForm.reset();
    }
  }

  guardarPoliticaForm(value: any) {
    let arraypolitica: string[] = [];
    let arrayConst: string[] = [];

    arraypolitica.push(this.estPolitica = value.estadoPolitica);
    arraypolitica.push(this.titPolitica = value.tituloPolitica);
    arraypolitica.push(this.politica = value.politica);

    arrayConst.push(Constantes.ESTADO_POLITICAS_VIGENTES)
    arrayConst.push(Constantes.TITULO_POLITICAS_VIGENTES)
    arrayConst.push(Constantes.POLITICAS_VIGENTES)

    for (let i = 0; i < arraypolitica.length; i++) {
      let parametros = new parametrosDTO;
      parametros.codapp = Constantes.NOMBRE_APLICACION;
      parametros.nombre = arrayConst[i];
      parametros.valor = arraypolitica[i];
      this.admPerfilesService.guardarPropiedad(parametros);
    }
  }



  guardarContactanosForm(value: any) {
    let arraypolitica: string[] = [];
    let arrayConst: string[] = [];

    arraypolitica.push(this.texto = value.texto);
    arraypolitica.push(this.correo = value.correo);

    arrayConst.push(Constantes.TEXTO_CONTACTENOS)
    arrayConst.push(Constantes.CORREO_CONTACTENOS)

    for (let i = 0; i < arraypolitica.length; i++) {
      let parametros = new parametrosDTO;
      parametros.codapp = Constantes.NOMBRE_APLICACION;
      parametros.nombre = arrayConst[i];
      parametros.valor = arraypolitica[i];
      this.admPerfilesService.guardarPropiedad(parametros);
    }
  }


  guardarcomponenteFlotanteForm(value: any) {
    let parametro = new parametrosDTO;
    let lstParametros = new Array<parametrosDTO>();
    parametro.codapp = Constantes.NOMBRE_APLICACION;
    parametro.nombre = Constantes.PROP_COMPONENTE_FLOTANTE_NAME;
    parametro.valor = value.nombreComponenteFlotante;
    lstParametros.push(parametro);
    let parametro1 = new parametrosDTO;
    parametro1.codapp = Constantes.NOMBRE_APLICACION;
    parametro1.nombre = Constantes.PROP_COMPONENTE_FLOTANTE_URL;
    parametro1.valor = value.urlComponenteFlotante;
    lstParametros.push(parametro1);
    let parametro2 = new parametrosDTO;
    parametro2.codapp = Constantes.NOMBRE_APLICACION;
    parametro2.nombre = Constantes.PROP_COMPONENTE_ESTADO;
    parametro2.valor = value.estadoComponenteFlotante;
    lstParametros.push(parametro2);
    lstParametros.map(item => {
      this.admPerfilesService.guardarPropiedad(item);
    });
  }

  guardarDiasInactUsuarioForm(value: any) {
    let parametro = new parametrosDTO;
    let lstParametros = new Array<parametrosDTO>();
    parametro.codapp = Constantes.NOMBRE_APLICACION;
    parametro.nombre = Constantes.PROP_INACT_USUARIO;
    parametro.valor = value.diasInactivacionComponente;
    this.admPerfilesService.guardarPropiedad(parametro);
  }

  guardarVencimientoXInactivacionForm(value: any) {
    let parametro = new parametrosDTO;
    parametro.codapp = Constantes.NOMBRE_APLICACION;
    parametro.nombre = Constantes.PROP_ACTIVACION_VENCIMIENTO;
    parametro.valor = value.inputEstadoVencimiento;
    this.admPerfilesService.guardarPropiedad(parametro);
  }

  editorConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: 'auto',
    minHeight: '0',
    maxHeight: 'auto',
    width: 'auto',
    minWidth: '0',
    translate: 'yes',
    enableToolbar: true,
    showToolbar: true,
    placeholder: 'Enter text here...',
    defaultParagraphSeparator: '',
    defaultFontName: '',
    defaultFontSize: '',
    fonts: [
      { class: 'arial', name: 'Arial' },
      { class: 'times-new-roman', name: 'Times New Roman' },
      { class: 'calibri', name: 'Calibri' },
      { class: 'comic-sans-ms', name: 'Comic Sans MS' }
    ],
    customClasses: [
      {
        name: 'quote',
        class: 'quote',
      },
      {
        name: 'redText',
        class: 'redText'
      },
      {
        name: 'titleText',
        class: 'titleText',
        tag: 'h1',
      },
    ],

    uploadWithCredentials: false,
    sanitize: true,
    toolbarPosition: 'top',
    toolbarHiddenButtons: [
      ['italic'],
      ['fontSize'],
      ['insertImage'],
      ['textColor']
    ]
  };


  guardartycForm(value: any) {
    const dialogActualizar = this.dialog.open(DialogComponent, {
      data: '¿Desea guardar Términos y Condiciones?'
    });
    dialogActualizar.afterClosed().subscribe(res => {

      if (res) {
        Swal.fire({
          text: 'Cargando Información',
          allowOutsideClick: false
        });
        Swal.showLoading();

        let parametros = new parametrosDTO;
        parametros.codapp = Constantes.NOMBRE_APLICACION;
        const propContratos: any[] = JSON.parse(this.storageService.getValuePropiedad(Constantes.PROP_CONTRATOS));

        propContratos.forEach(elem => {
          if (elem.id == (this.terminosSeleccionado.id + 1)) {
            parametros.nombre = elem.nombre;
          }
        });

        const jsonContrato: any = {
          id: this.terminosSeleccionado.id + 1,
          name: this.terminosSeleccionado.name,
          desc: this.terminosSeleccionado.desc,
          terminos: btoa(value.texto)
        }

        parametros.valor = "´" + JSON.stringify(jsonContrato) + "´";
        this.admPerfilesService.actualizarPropiedad(parametros).subscribe((parametrosEAFResponse: ParametrosEAFResponse) => {

          if (parametrosEAFResponse.codigo == Constantes.CODIGO_EXITOSO) {
            this.admPerfilesService.consultarPropiedades(Constantes.NOMBRE_APLICACION, null).subscribe((parametrosEAFResponse: ParametrosEAFResponse) => {
              if (parametrosEAFResponse.cursorparametros.parametros != null) {
                this.storageService.actualizarPropiedad(parametrosEAFResponse.cursorparametros.parametros);
                Swal.close();
                this.generalService.mostrarMensaje('Success', parametrosEAFResponse.descripcion, 'success');
                //this.getTyC();
                location.reload();
                return;
              }
            });
          } else {
            Swal.close();
            this.generalService.mostrarMensaje('Success', parametrosEAFResponse.descripcion, 'error');
            return;
          }
        });
      }
    }),
      error => {
        if (error) {
          console.log(error);
        }
      }
  }


  cargarCorreos() {

    const propCorreos: correosDTO[] = JSON.parse(this.storageService.getValuePropiedad(Constantes.PROP_CORREOS_PQRS));
    propCorreos.forEach(element => {

      this.lstCorreo.correos.push(element);
    });

    this.dataSourceCorreoPqrs = new MatTableDataSource<correosDTO>(this.lstCorreo.correos);
    this.lstCorreo.correos.forEach(element => {
      this.addControlFormArray(element.structure);
    });

  }

  guardarCorreo(elem: any, parametros: any) {
    const dialogActualizar = this.dialog.open(DialogComponent, {
      data: '¿Desea guardar Correo Usuario Pqrs?'
    });
    dialogActualizar.afterClosed().subscribe(res => {

      if (res) {
        Swal.fire({
          text: 'Cargando Información',
          allowOutsideClick: false
        });
        Swal.showLoading();
        let parametro = new parametrosDTO;
        let lstParametros = new Array<parametrosDTO>();
        Object.entries(this.selectionCorreo).forEach(([key, value], index) => {
        });

        lstParametros.map(item => {
          this.admPerfilesService.actualizarPropiedad(item).subscribe((parametrosEAFResponse: ParametrosEAFResponse) => {
            if (parametrosEAFResponse.codigo == Constantes.CODIGO_EXITOSO) {
              this.admPerfilesService.consultarPropiedades(Constantes.NOMBRE_APLICACION, null).subscribe((parametrosEAFResponse: ParametrosEAFResponse) => {
                if (parametrosEAFResponse.cursorparametros.parametros != null) {
                  this.storageService.actualizarPropiedad(parametrosEAFResponse.cursorparametros.parametros);
                  Swal.close();
                  this.generalService.mostrarMensaje('Success', parametrosEAFResponse.descripcion, 'success');

                  location.reload();
                  return;
                }
              });
            } else {
              Swal.close();
              this.generalService.mostrarMensaje('Success', parametrosEAFResponse.descripcion, 'error');
              return;
            }
          });
        });
      }

    }),
      error => {
        if (error) {
          console.log(error);
        }
      }
  }

  guardarPropiedadesPQR() {
    for (let i = 0; i < this.listaMensajesPQR.length; i++) {
      this.listaMensajesPQR[i].valor = this.formularioDinamicoPQRForm.controls['valoresPropiedad'].get(i.toString()).value;
    }
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
    let parametros = new parametrosDTO;
    parametros.codapp = Constantes.NOMBRE_APLICACION;
    parametros.nombre = Constantes.PROP_PQR_CONFIGURACION_MSJ;
    parametros.valor = JSON.stringify(this.listaMensajesPQR);
    this.admPerfilesService.actualizarPropiedad(parametros).subscribe((parametrosEAFResponse: ParametrosEAFResponse) => {
      if (parametrosEAFResponse.codigo == Constantes.CODIGO_EXITOSO) {
        this.generalService.mostrarMensaje("Exito", "Guardado exitoso", "success");
        this.storageService.actualizarPropiedadEspecifica(Constantes.PROP_PQR_CONFIGURACION_MSJ, JSON.stringify(this.listaMensajesPQR));
      } else {
        this.generalService.mostrarMensaje("Error", parametrosEAFResponse.descripcion, "error");
      }
    });

  }
  configuracionControlPQR() {
    this.formularioDinamicoPQRForm = this.fb.group({
      valoresPropiedad: this.fb.array([]),
    });

    this.listaMensajesPQR = JSON.parse(this.storageService.getValuePropiedad(Constantes.PROP_PQR_CONFIGURACION_MSJ));

    const control = <FormArray>this.formularioDinamicoPQRForm.controls['valoresPropiedad'];
    for (let i = 0; i < this.listaMensajesPQR.length; i++) {
      control.push((new FormControl(this.listaMensajesPQR[i].valor)));
    }
    this.cargueCompletoPQR = true;
  }

  guardarTipoSolicitudPQR() {
    for (let i = 0; i < this.listaTipoSolicitudPQR.length; i++) {
      this.listaTipoSolicitudPQR[i].valor = this.tipoSolicitudPqrsForm.controls['valoresPqrsSolicitud'].get(i.toString()).value;
    }
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
    let parametros = new parametrosDTO;
    parametros.codapp = Constantes.NOMBRE_APLICACION;
    parametros.nombre = Constantes.PROP_PQR_TIPO_SOLICITUD;
    parametros.valor = JSON.stringify(this.listaTipoSolicitudPQR);
    this.admPerfilesService.actualizarPropiedad(parametros).subscribe((parametrosEAFResponse: ParametrosEAFResponse) => {
      if (parametrosEAFResponse.codigo == Constantes.CODIGO_EXITOSO) {
        this.generalService.mostrarMensaje("Exito", "Guardado exitoso", "success");
        this.storageService.actualizarPropiedadEspecifica(Constantes.PROP_PQR_TIPO_SOLICITUD, JSON.stringify(this.listaTipoSolicitudPQR));
      } else {
        this.generalService.mostrarMensaje("Error", parametrosEAFResponse.descripcion, "error");
      }
    });

  }
  configuracionTipoSolicitudPQR() {
    this.tipoSolicitudPqrsForm = this.fb.group({
      nuevoValor: [''],
      valoresPqrsSolicitud: this.fb.array([]),
    });
    this.listaTipoSolicitudPQR = JSON.parse(this.storageService.getValuePropiedad(Constantes.PROP_PQR_TIPO_SOLICITUD));
    const control = <FormArray>this.tipoSolicitudPqrsForm.controls['valoresPqrsSolicitud'];
    for (let i = 0; i < this.listaTipoSolicitudPQR.length; i++) {
      control.push((new FormControl(this.listaTipoSolicitudPQR[i].valor)));
    }
  }
  agregarTipoSolicitudPQR() {
    const valor = this.tipoSolicitudPqrsForm.get('nuevoValor').value;
    if (this.listaTipoSolicitudPQR.includes(valor)) {
      return;
    }
    const obj: any = { nombre: valor, valor: '1' };
    this.listaTipoSolicitudPQR.push(obj);
    const control = <FormArray>this.tipoSolicitudPqrsForm.controls['valoresPqrsSolicitud'];
    control.push((new FormControl(true)));
  }
  eliminarTipoSolicitudPQR(indice: number) {
    this.listaTipoSolicitudPQR.splice(indice, 1);
    const control = <FormArray>this.tipoSolicitudPqrsForm.controls['valoresPqrsSolicitud'];
    control.removeAt(indice);
  }
}