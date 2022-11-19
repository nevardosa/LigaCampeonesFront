import { HttpEvent, HttpEventType} from '@angular/common/http';
import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { Observable } from 'rxjs';
import { contratosDTO, parametrosDTO, ParametrosEAFResponse } from 'src/app/models/admPerfiles/propiedades.model';
import { Token } from 'src/app/models/auth/auth.model';
import { AuthSFTP } from 'src/app/models/authSFTP.model';
import { CategoriaModel, respuestaCategoriaModel } from 'src/app/models/categoria.model';
import { crearPQRRequestModel, PQRModel, requestConsultarPQRModel, ResponderPQRRequestModel, responseConsultaPQRModel, responseGeneralModel } from 'src/app/models/pqr.model';
import { GeneralService } from 'src/app/services/api-ser-general.service';
import { AuthTokenService } from 'src/app/services/auth-token.service';
import { StorageService } from 'src/app/services/storage.service';
import { WSLigaCampeonesService } from 'src/app/services/wsliga-campeones.service';
import { Constantes } from 'src/app/shared/Constantes';
import Swal from 'sweetalert2';
import * as FileSaver from 'file-saver';
import { AdmPerfilesService } from 'src/app/services/api-adm-perfiles.service';

@Component({
  selector: 'app-detalle-pqr',
  templateUrl: './detalle-pqr.component.html',
  styleUrls: ['./detalle-pqr.component.css']
})
export class DetallePqrComponent implements OnInit {

  listaMensajesPQR = [];

  formulario: FormGroup;
  pqr : PQRModel ;
  token: string = null;
  listaPQR: PQRModel[] = [];  
  cargacompleta : boolean  = false;
  listTipoSolicitud: string[] = [];

  //variables creacion
  nombreUsuario: string;
  v_cedulaUsuario:string;
  listaCategorias: CategoriaModel[] = [];
  listaMotivos: string[] = [];
  formularioCreacionPQR: FormGroup;
  perfilLogueado;
  selectedFiles: FileList;
  progressInfos = [];
  message :string= '';
  fileInfos: Observable<any>;
  cantArchivosCargados :number = 0;
  @ViewChild('divTyC') div: ElementRef;
  contrato: contratosDTO=null;
  listContratos: contratosDTO[] = [];
  vCantidadAdjuntosPermitidos : number; 
  maximoPesoParaArchivosPQR : Number;


  constructor(
    private router: Router
    , private ligaService: WSLigaCampeonesService
    , private renderer: Renderer2
    , private generalService: GeneralService
    , private storageService: StorageService
    , private fb: FormBuilder
    , private authTokenService: AuthTokenService
    , private activatedRoute: ActivatedRoute
    , private cookieService: CookieService, 
    private admPerfilesService: AdmPerfilesService
  ) {
    
   }

  ngOnInit(): void {
    this.listaMensajesPQR = JSON.parse( this.storageService.getValuePropiedad(Constantes.PROP_PQR_CONFIGURACION_MSJ));
    this.vCantidadAdjuntosPermitidos = this.listaMensajesPQR[this.listaMensajesPQR.map(object => object.llave).indexOf(Constantes.PROP_PQR_CANTIDAD_ADJUNTOS_PERMITIDOS)].valor;
    this.maximoPesoParaArchivosPQR = this.listaMensajesPQR[this.listaMensajesPQR.map(object => object.llave).indexOf(Constantes.PROP_PQR_MAXIMO_PESO_ADJUNTOS)].valor;

    this.perfilLogueado = this.cookieService.get(Constantes.PROP_PERFIL_LOGUEADO); 
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if(id == Constantes.CONST_REGISTRO_NUEVO){
      this.cargarTipoSpolicitud()
      this.cargacompleta = true;
      this.cargarCategorias();
      this.crearFormularioDeRegistro();
      this.cargarContratos();
      this.nombreUsuario = this.cookieService.get(Constantes.NOMBRE_USUARIO);
      this.v_cedulaUsuario = atob(this.cookieService.get('user'));
    }else{
      this.pqr = new PQRModel();
      this.cargarInformacionPQR(Number(id.valueOf().replace(':', '')));
    }
    
  }
  crearFormularioRespuesta() {
    let PATRON_SOLO_DIGITOS = new RegExp(Constantes.PATRON_SOLO_DIGITOS);
    this.formulario = this.fb.group({
      descripcionRespuesta: ['', [Validators.required]],
      estado: [''],
      cerrarPQR : ['', false]
    });

    this.formulario.controls['cerrarPQR'].valueChanges.subscribe(valorCheck => {
      if(valorCheck){
        Swal.fire({
          title: 'Aviso',
          text:  this.listaMensajesPQR[this.listaMensajesPQR.map(object => object.llave).indexOf(Constantes.PROP_MSJ_AVISO_CERRAR_PQR)].valor,
          icon: 'warning',
          showCancelButton: true,
          cancelButtonColor: '#f53201',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#3085d6'
        }).then((result) => {
          if (!result.isConfirmed) {
            this.formulario.patchValue({cerrarPQR : false });
          }
        });
      }
    });

    
  }

  crearFormularioDeRegistro() {
    let PATRON_SOLO_DIGITOS = new RegExp(Constantes.PATRON_SOLO_DIGITOS);
    this.formularioCreacionPQR = this.fb.group({
      descripcion:  ['', [Validators.required]],
      idCategoria:  ['', [Validators.required]],
      motivo: ['', [Validators.required]],
      tipoSolicitud: ['', [Validators.required]],
      aceptoTerminos: ['', [Validators.required]],
    });
  }

  get descripcion() {
    return this.formularioCreacionPQR.get('descripcion').invalid && this.formularioCreacionPQR.get('descripcion').touched;
  }
  get idCategoria() {
    return this.formularioCreacionPQR.get('idCategoria').invalid && this.formularioCreacionPQR.get('idCategoria').touched;
  }
  get motivo() {
    return this.formularioCreacionPQR.get('motivo').invalid && this.formularioCreacionPQR.get('motivo').touched;
  }
  get tipoSolicitud() {
    return this.formularioCreacionPQR.get('tipoSolicitud').invalid && this.formularioCreacionPQR.get('tipoSolicitud').touched;
  }

  get aceptoTerminos() {
    return this.formularioCreacionPQR.get('aceptoTerminos').invalid && this.formularioCreacionPQR.get('aceptoTerminos').touched;
  }
  
  cargarInformacionPQR(idPqr : number){
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token;
      let request : requestConsultarPQRModel =  new requestConsultarPQRModel();
      request.idPQR = idPqr;
      this.ligaService.consultarPQR(request, this.token ).subscribe((response: responseConsultaPQRModel) => {
        if(response.codigo != Constantes.CODIGO_EXITOSO){
          this.generalService.mostrarMensaje('ERROR', response.descripcion, "success");
         return;
        }
        this.cargacompleta = true;
        this.pqr = response.listaPqrs[0];   
        this.listaPQR = response.listaPqrs.reverse();  
        this.crearFormularioRespuesta();
        Swal.close();   
      });      
    });
  }
  puedeResponderPQR(){
   
    if(this.pqr.estado == Constantes.CONST_ESTADO_PQR_CERRADA){
      return false;
    }
    else if(this.perfilLogueado ==  Constantes.PROP_ID_PERFIL_ADMIN && (this.pqr.estado == Constantes.CONST_ESTADO_PQR_ATENDIDA)){
      return false;
    }else if(this.perfilLogueado !=  Constantes.PROP_ID_PERFIL_ADMIN && this.pqr.estado != null && (this.pqr.estado == Constantes.CONST_ESTADO_PQR_EN_REVISION || this.pqr.estado == Constantes.CONST_ESTADO_PQR_RECIBIDA )){
      return false;
    }
    return true;
  }

  responderPQR(){
    if(this.formulario.invalid){
      return;
    }
    
    if(!this.validarDocumentosCargados()){
      return;
    }
    
    Swal.fire({
      title: '¿Guardar?',
      text:  this.listaMensajesPQR[this.listaMensajesPQR.map(object => object.llave).indexOf(Constantes.PROP_MSJ_CONFIRMAR_RTA_PQR)].valor,
      icon: 'question',
      showCancelButton: true,
      cancelButtonColor: '#f53201',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3085d6'
    }).then((result) => {
      if (result.isConfirmed) {
        this.authTokenService.authToken().subscribe((resp: Token) => {
          this.token = resp.token;
          let request: ResponderPQRRequestModel = new ResponderPQRRequestModel();
          request.descripcionRespuesta = this.formulario.get("descripcionRespuesta").value;
          request.idPQR = this.pqr.idPQR;

          if( this.formulario.get("cerrarPQR").value == true){
            request.estado = Constantes.CONST_PQR_CERRADA_PETICION_USUARIO;
          }
          let nombreArchivosAdjuntos = this.obtenerNombreArchivosAdjuntos();
          if(  nombreArchivosAdjuntos != ''){
            request.nombreDocumentosAdjuntos = nombreArchivosAdjuntos;
          }
          
          this.ligaService.responderPQR(request, this.token).subscribe((responsePQR:responseGeneralModel) =>{
            if(responsePQR.codigo != Constantes.CODIGO_EXITOSO){
              this.generalService.mostrarMensaje("ERROR", responsePQR.descripcion, "error");
              return;
            }

            if(this.selectedFiles == null || this.selectedFiles.length == 0){
              this.msjRespuestaPQR();
            }else{
              this.cargarArchivos(this.pqr.idPQR);
            }
          }

          );
        });
      }else{
        
      }
    });
    
  }
  msjRespuestaPQR(){
    if(this.pqr == null || this.pqr.idPQR == null){
      Swal.fire({
        title: 'Exito',
        text:  this.listaMensajesPQR[this.listaMensajesPQR.map(object => object.llave).indexOf(Constantes.PROP_MSJ_PQR_CREADA)].valor,
        icon: 'success',
        showCancelButton: true,
        cancelButtonColor: '#f53201',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3085d6'
      }).then((result) => {
        this.redireccionarAListadoPQR();
      });
    }else if(this.esUltimaObjecion()){
     
      Swal.fire({
        title: 'Exito',
        text: this.listaMensajesPQR[this.listaMensajesPQR.map(object => object.llave).indexOf(Constantes.PROP_MSJ_ULTIMA_OBJECION)].valor ,
        icon: 'success',
        showCancelButton: true,
        cancelButtonColor: '#f53201',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3085d6'
      }).then((result) => {
        this.redireccionarAListadoPQR();
      });
    }else if( this.formulario.get("cerrarPQR").value == true){
      Swal.fire({
        title: 'Exito',
        text: this.listaMensajesPQR[this.listaMensajesPQR.map(object => object.llave).indexOf(Constantes.PROP_MSJ_PQR_CERRADA)].valor ,
        icon: 'success',
        showCancelButton: true,
        cancelButtonColor: '#f53201',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#3085d6'
      }).then((result) => {
        this.redireccionarAListadoPQR();
      });
    }
    else {
    let msj = (this.esPerfilAdministrador())? 'PQR respondida':this.listaMensajesPQR[this.listaMensajesPQR.map(object => object.llave).indexOf(Constantes.PROP_MSJ_PQR_RESPONDIDA)].valor ; 
    Swal.fire({
      title: 'Exito',
      text:  msj,
      icon: 'success',
      showCancelButton: true,
      cancelButtonColor: '#f53201',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3085d6'
    }).then((result) => {
      this.redireccionarAListadoPQR();
    }); }
  }

  redireccionarAListadoPQR(){
    let perfilLogueado = this.cookieService.get(Constantes.PROP_PERFIL_LOGUEADO); 
    if(perfilLogueado ==  Constantes.PROP_ID_PERFIL_ADMIN){
      this.router.navigate([`administrador/pqrs`]);
    }else{
      this.router.navigate([`usuario/pqrs`]);
    }
  }
  cargarContratos() {
    this.admPerfilesService.consultarPropiedades(Constantes.NOMBRE_APLICACION, null).subscribe((parametrosEAFResponse: ParametrosEAFResponse) => {
      if (parametrosEAFResponse.cursorparametros.parametros != null) {
        let parametros: parametrosDTO[] = parametrosEAFResponse.cursorparametros.parametros;
        let newParams: string[] = [];

        const propContratos: any[] = JSON.parse(this.storageService.getValuePropiedad(Constantes.PROP_CONTRATOS));
        propContratos.splice(0, 4);
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

  cargarCategorias(){
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token;
      let categoria : CategoriaModel = new CategoriaModel();
      categoria.estado = Constantes.CONST_ACTIVO;
      this.ligaService.consultarCategorias(categoria, this.token).subscribe((responseCategoria : respuestaCategoriaModel )=>{
        Swal.close();
        if(responseCategoria.codigo != Constantes.CODIGO_EXITOSO){
          this.generalService.mostrarMensaje("ERROR", "No fue posible cargar el listado de categorias", "error");
          return;
        }
        this.listaCategorias = responseCategoria.listaCategorias;
      });
    });
  }

  cargarMotivos(){
    this.listaMotivos = null;
    let idCategoriaSeleccionada = Number(this.formularioCreacionPQR.get("idCategoria").value);
    let categoria;
    this.listaCategorias.forEach(element => { 
      if(element.idCategoria == idCategoriaSeleccionada ){
        categoria = element ;
      }});
    if(categoria && categoria.listaMotivoPqrs){
      this.listaMotivos = categoria.listaMotivoPqrs.split(",");
    }
  }
  aceptaTerminos(){
    return this.formularioCreacionPQR.get('aceptoTerminos').value;
  }

  cargarTerminos() {
    if (this.listContratos.length >0) {      
      const p: HTMLParagraphElement = this.renderer.createElement('div');
      p.innerHTML = atob(this.listContratos[0].terminos);
      this.renderer.appendChild(this.div.nativeElement, p);
    }
  }
  validarDocumentosCargados(){
    let valido = true;
    if(this.selectedFiles != null && this.selectedFiles.length > 0){
      if(!this.validarCantidadArchivosAdjuntos()){
        this.generalService.mostrarMensaje("Error", "Sobrepasa el maximo de documentos adjuntos permitido: " + this.vCantidadAdjuntosPermitidos, "error");
        valido = false;
      }

      if(!this.validarPesoArchivosAdjuntos()){
        this.generalService.mostrarMensaje("Error", "Los archivos adjuntos superan el peso maximo permitido: " + this.maximoPesoParaArchivosPQR + "MB" , "error");
        valido = false;
      }
      if(!this.validarNombresDocumentos()){
        this.generalService.mostrarMensaje("Error", "Nombre de archivo repetido, por favor modificarlo", "error");
        valido = false;
      }
    }
    return valido;
  }
  crearPQR(){
    if(this.formularioCreacionPQR.invalid){
      return;
    }
    if(!this.validarDocumentosCargados()){
      return;
    }
    
    Swal.fire({
      title: '¿Guardar?',
      text:  this.listaMensajesPQR[this.listaMensajesPQR.map(object => object.llave).indexOf(Constantes.PROP_MSJ_CREAR_PQR)].valor,
      icon: 'question',
      showCancelButton: true,
      cancelButtonColor: '#f53201',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#3085d6'
    }).then((result) => {
      let aceptoTerminos = this.formularioCreacionPQR.get("aceptoTerminos").value;
      if (result.isConfirmed && aceptoTerminos == true) {
        this.authTokenService.authToken().subscribe((resp: Token) => {
          this.token = resp.token;

          let request: crearPQRRequestModel = new crearPQRRequestModel();
          let user: string = atob(this.cookieService.get('user'));
          request.cedulaUsuario = Number(user);
          request.descripcion = this.formularioCreacionPQR.get("descripcion").value;
          request.idCategoria = this.formularioCreacionPQR.get("idCategoria").value;
          request.motivo = this.formularioCreacionPQR.get("motivo").value;
          request.tipoSolicitud = this.formularioCreacionPQR.get("tipoSolicitud").value;
          request.nombreDocumentosAdjuntos = this.obtenerNombreArchivosAdjuntos();
          this.ligaService.crearPQR(request, this.token).subscribe((responsePQR:responseConsultaPQRModel) =>{
            if(responsePQR.codigo != Constantes.CODIGO_EXITOSO){
              this.generalService.mostrarMensaje("ERROR", responsePQR.descripcion, "error");
              return;
            }else{
              if(this.selectedFiles == null || this.selectedFiles.length == 0){

                Swal.fire({
                  title: 'Exito',
                  text:  this.listaMensajesPQR[this.listaMensajesPQR.map(object => object.llave).indexOf(Constantes.PROP_MSJ_PQR_CREADA)].valor,
                  icon: 'success',
                  showCancelButton: true,
                  cancelButtonColor: '#f53201',
                  confirmButtonText: 'Aceptar',
                  confirmButtonColor: '#3085d6'
                }).then((result) => {
                  this.redireccionarAListadoPQR();
                });
                
                return;
              }else{
                this.cargarArchivos(responsePQR.listaPqrs[0].idPQR);
              }
            }
            
          }

          );
        });
      }else{
        
      }
    });
  }

  selectFiles(event) {
    this.progressInfos = [];
    this.selectedFiles = event.target.files;
  }
  obtenerNombreArchivosAdjuntos(){
    let nombresArchivosAdjuntosPQR = '';
    
    if(this.selectedFiles != null ){
      for (let idx = 0; idx < this.selectedFiles.length; idx++) {
        let file = this.selectedFiles[idx];
        nombresArchivosAdjuntosPQR = nombresArchivosAdjuntosPQR +  '|' + file.name.replace(/\s+/g, '_') ;       
      }
      return nombresArchivosAdjuntosPQR;
    }else{
      return "";
    }

  }
  validarNombresDocumentos(){
    if(this.pqr == null || this.pqr.idPQR== null){
      return true;
    }
    let nombreArchivo = '';
      this.listaPQR.forEach(element => {
        if(element.nombreDocumentosAdjuntos != null ){
          nombreArchivo = nombreArchivo + element.nombreDocumentosAdjuntos;
        }
      });
      console.log(nombreArchivo);
      for (let idx = 0; idx < this.selectedFiles.length; idx++) {
        let file = this.selectedFiles[idx];
        if(nombreArchivo.includes("|"+this.pqr.idPQR +"_"+file.name.replace(/\s+/g, '_') )){
          return false;
        }
      }
      return true;
    
  }


  validarPesoArchivosAdjuntos(){
    let pesoArchivos = 0;
    for (let idx = 0; idx < this.selectedFiles.length; idx++) {
      let file = this.selectedFiles[idx];
      pesoArchivos = pesoArchivos + file.size;
    }
    pesoArchivos = pesoArchivos/1000000;
    return pesoArchivos < this.maximoPesoParaArchivosPQR;
  }
  validarCantidadArchivosAdjuntos(){
    return this.selectedFiles.length <= this.vCantidadAdjuntosPermitidos ;
  }

  cargarArchivos(idPQR: number) {
    this.message = '';
    

    for (let idx = 0; idx < this.selectedFiles.length; idx++) {
      let file = this.selectedFiles[idx];
      this.progressInfos[idx] = { value: 0, fileName: file.name };


      let nombreArchivo = idPQR + '_'+ file.name.replace(/\s+/g, '_') ;
      let authSFTP : AuthSFTP= new AuthSFTP();
      authSFTP.ip = this.storageService.getValuePropiedad(Constantes.PROP_PQR_LINES_HOST_FTP);
      authSFTP.usuario = this.storageService.getValuePropiedad(Constantes.PROP_PQR_LINES_USER_FTP);
      authSFTP.contrasena = this.storageService.getValuePropiedad(Constantes.PROP_PQR_LINES_PASS_FTP);
      authSFTP.ruta = this.storageService.getValuePropiedad(Constantes.PROP_PQR_LINES_PATH_FTP);



      this.generalService.cargarArchivoSFTP(file, nombreArchivo ,authSFTP).subscribe( (event: HttpEvent<any>) => {
        switch (event.type) {
          case HttpEventType.UploadProgress:
            this.progressInfos[idx].value = Math.round(100 * event.loaded / event.total);
              break;
          case HttpEventType.Response:
            this.cantArchivosCargados = this.cantArchivosCargados +1;
            if(this.cantArchivosCargados == this.selectedFiles.length){
              this.msjRespuestaPQR();
            }
                break;
        }
        },
        err => {
          this.progressInfos[idx].value = 0;
          this.message = 'Could not upload the file:' + file.name.replace(/\s+/g, '_') ;
        }
        
        ); }
  }

  obtenerlistaDocumentosAdjuntosPQR(pqr: PQRModel){
    let   listaDocumentosAdjuntosPQR :string[] = [];
    if(pqr.nombreDocumentosAdjuntos && pqr.nombreDocumentosAdjuntos != ''){
      listaDocumentosAdjuntosPQR = pqr.nombreDocumentosAdjuntos.split('|').filter(item => item != '');
    }
    return listaDocumentosAdjuntosPQR;
  }

  descargarArchivoAdjunto(nombreArchivo:string){
   
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();
    
    if(nombreArchivo == null){
      nombreArchivo = '';
      this.listaPQR.forEach(element => {
        if(element.nombreDocumentosAdjuntos != null ){
          nombreArchivo = nombreArchivo + element.nombreDocumentosAdjuntos;
        }
      });
      nombreArchivo = nombreArchivo.replace(/\|/g, ',').replace(',', '');
    }

    let authSFTP : AuthSFTP= new AuthSFTP();
    authSFTP.ip = this.storageService.getValuePropiedad(Constantes.PROP_PQR_LINES_HOST_FTP);
    authSFTP.usuario = this.storageService.getValuePropiedad(Constantes.PROP_PQR_LINES_USER_FTP);
    authSFTP.contrasena = this.storageService.getValuePropiedad(Constantes.PROP_PQR_LINES_PASS_FTP);
    authSFTP.ruta = this.storageService.getValuePropiedad(Constantes.PROP_PQR_LINES_PATH_FTP);

    this.generalService.descargarArchivoSFTP(nombreArchivo, authSFTP).subscribe(resp => {
      const blob = new Blob([resp], {
        type: 'application/zip'
      });
      FileSaver.saveAs(blob, "DOCUMENTOS_ADJUNTOS_PQRS_"+ this.pqr.idPQR + new Date());
      Swal.close();
    });
    
   
  }

  esPerfilAdministrador(){
    let perfilLogueado = this.cookieService.get(Constantes.PROP_PERFIL_LOGUEADO); 
    return perfilLogueado ==  Constantes.PROP_ID_PERFIL_ADMIN;
  }

  esUltimaObjecion(){
    let vCantidadObjecionesHabilitadas = Number(this.listaMensajesPQR[this.listaMensajesPQR.map(object => object.llave).indexOf(Constantes.PROP_MSJ_CANT_RTAS_PQR)].valor);
    let cantRTAS = (vCantidadObjecionesHabilitadas * 2)+2;
    return this.listaPQR.length == cantRTAS-2;
  }

  cargarTipoSpolicitud() {
    this.listTipoSolicitud =[];
    const lista = JSON.parse(this.storageService.getValuePropiedad(Constantes.PROP_PQR_TIPO_SOLICITUD));
    // console.log(lista);
    lista.forEach(element => {
      if(element.valor == true){
        this.listTipoSolicitud.push(element.nombre)
      }
    });
    // console.log(this.listTipoSolicitud);

  }
  


}
