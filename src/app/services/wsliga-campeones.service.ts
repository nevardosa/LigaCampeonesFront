import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpEvent, HttpRequest, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { UserModel, respuestaRedMaestraModel, RequestDescargaHistoricoUsuario } from '../models/user/user.model';
import { LugaresModel } from '../models/lugares/lugares.model';
import { CategoriaModel } from '../models/categoria.model';
import { ProductoModel } from '../models/articulo.model';
import { RequestDetallePedidoModel, PedidoDetallado, DetalleActualizacionPedido } from '../models/pedido.model';
import { articulosRTAModel } from '../models/articulo.model';
import { ResponseResumenPuntos, resumenPuntosDTO } from '../models/puntos-canjes.model';
import { Observable, Subject } from 'rxjs';
import { Constantes } from '../shared/Constantes';
import { RequestHistoricoRedencionModel } from '../models/pedido.model';
import { RequestPuntosGanadosModel } from '../models/puntos-canjes.model';
import { LogModel } from '../models/general/log.model';
import { TipoLog } from '../enum/tipo_log.model';
import { StorageService } from '../services/storage.service';
import { PerfilModel, PerfilxCategoria } from '../models/perfil.model';
import { ReferidoModel } from '../models/referido.model';
import { Cabecera } from '../models/userInfo.model';
import { UpdateOperationTransferModel } from '../models/updateOperationTransfer.model';
import { ComprobateStateTransferModel } from '../models/comprobateStateTransfer.model';
import { PreguntaModel } from '../models/pregunta.model';
import { ImagenModel } from '../models/imagen.model';
import { RequestPuntosVencidosModel } from '../models/puntos-vencidos.model';
import { timeout } from 'rxjs/operators';
import { crearPQRRequestModel, HistoricoPqrsRequestModel, requestConsultarPQRModel, ResponderPQRRequestModel } from '../models/pqr.model';


@Injectable({
  providedIn: 'root'
})
export class WSLigaCampeonesService {

  private url;

  private pedido: RequestDetallePedidoModel[] = [];//id producto- cantidad
  private pedidoDetallado: PedidoDetallado[] = [];//pedido con la informacion del producto
  private totalProductosSolicitados: number = 0;
  private totalPuntosSolicitados: number = 0;
  public puntosActuales: number = 0;
  public puntosActuales$ = new Subject<number>();


  private resumenPuntos$ = new Subject<resumenPuntosDTO[]>();




  private ip;
  constructor(private http: HttpClient
    , private cookieService: CookieService
    , private storageService: StorageService
  ) {

    this.cargarInformacionBasica();
  }

  cargarInformacionBasica() {
    this.url = Constantes.ENDPOINT_LIGA_CAMPEONES;
  }

  ConsultarUsuario(data: UserModel, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/users/admUsers?Accion=c&UUID=${this.storageService.getCurrentSession().uuid}&usuarioEditor=${this.cookieService.get('usuarioEditor')}`, data, { headers: headers });
  }

  CambiarContrasena(cedula: string, contrasena: string, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    let params = new HttpParams();
    params = params.append('cedula', cedula);
    params = params.append('contrasena', contrasena);
    return this.http.get(`${this.url}/auth/restaurarContrasena`, { params: params, headers: headers });

  }

  validarToken(tokenCambio: any) {
    let headers = new HttpHeaders();
    let params = new HttpParams();
    params = params.append('token', tokenCambio);
    return this.http.post(`${this.url}/auth/validate?token=${tokenCambio}`, { headers: headers });

  }

  IniciarSesion(usuario: string, pass: string, idPerfil: number, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    let params = new HttpParams();
    params = params.append('cedula', usuario);
    params = params.append('clave', pass.replace("#", "\u0023"));
    params = params.append('id_perfil', idPerfil.toString());
    params = params.append('UUID', this.storageService.getCurrentSession().uuid);
    return this.http.get(`${this.url}/users/validarUsuario`, { params: params, headers: headers });

  }

  ActualizarUsuario(data: UserModel, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    let params = new HttpParams();
    return this.http.post(`${this.url}/users/admUsers?Accion=a&UUID=${this.storageService.getCurrentSession().uuid}&usuarioEditor=${this.cookieService.get('usuario')}`, data, { headers: headers });
  }

  ConsultarLugares(lugares: LugaresModel, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/lugares/admLugares?Accion=c&UUID=${this.storageService.getCurrentSession().uuid}`, lugares, { headers: headers });
  }

  CrearUsuario(data: UserModel, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/users/admUsers?Accion=i&UUID=${this.storageService.getCurrentSession().uuid}&usuarioEditor=${this.cookieService.get('usuarioEditor')}`, data, { headers: headers }).pipe(timeout(5000));
  }

  ConsultarUsuarioAdmin(data: UserModel, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/users/admUsers?Accion=c&UUID=${this.storageService.getCurrentSession().uuid}&usuarioEditor=${this.cookieService.get('usuario')}`, data, { headers: headers });
  }

  ConsultarUsuarioRedMaestra(cedula: number, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.get<respuestaRedMaestraModel>(`${this.url}/champions/GetVendors?cedula=${cedula}&UUID=${this.storageService.getCurrentSession().uuid}`, { headers: headers });
  }

  /* operaciones para CATEGORIAS */
  consultarCategorias(categoria: CategoriaModel, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/categorias/admCategorias?Accion=c&UUID=${this.storageService.getCurrentSession().uuid}`, categoria, { headers: headers });
  }

  crearCategoria(categoria: CategoriaModel, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/categorias/admCategorias?Accion=i&UUID=${this.storageService.getCurrentSession().uuid}`, categoria, { headers: headers });
  }

  actualizarCategoria(categoria: CategoriaModel, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/categorias/admCategorias?Accion=a&UUID=${this.storageService.getCurrentSession().uuid}`, categoria, { headers: headers });
  }

  actualizarPerfil(perfil: PerfilModel, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/perfil/admPerfiles?Accion=a&UUID=${this.storageService.getCurrentSession().uuid}`, perfil, { headers: headers });
  }

  consultarPerfiles(perfil: PerfilModel, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/perfil/admPerfiles?Accion=c&UUID=${this.storageService.getCurrentSession().uuid}`, perfil, { headers: headers });
  }

  consultarPerfilxCategoria(perfilxCategoria: PerfilxCategoria, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/perfilXCategoria/admPerfilXCategoria?Accion=c&UUID=${this.storageService.getCurrentSession().uuid}`, perfilxCategoria, { headers: headers });
  }

  crearPerfilxCategoria(perfilxCategoria: PerfilxCategoria, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/perfilXCategoria/admPerfilXCategoria?Accion=i&UUID=${this.storageService.getCurrentSession().uuid}`, perfilxCategoria, { headers: headers });
  }

  eliminarPerfilxCategoria(perfilxCategoria: PerfilxCategoria, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/perfilXCategoria/admPerfilXCategoria?Accion=e&UUID=${this.storageService.getCurrentSession().uuid}`, perfilxCategoria, { headers: headers });
  }

  /* operaciones para PARAMETRIZACION */
  consultarPregunta(pregunta: PreguntaModel, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/preguntas/admPreguntas?Accion=c&UUID=${this.storageService.getCurrentSession().uuid}`, pregunta, { headers: headers });
  }

  crearPregunta(pregunta: PreguntaModel, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/preguntas/admPreguntas?Accion=i&UUID=${this.storageService.getCurrentSession().uuid}`, pregunta, { headers: headers });
  }

  actualizarPregunta(pregunta: PreguntaModel, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/preguntas/admPreguntas?Accion=a&UUID=${this.storageService.getCurrentSession().uuid}`, pregunta, { headers: headers });
  }

  eliminarPregunta(pregunta: PreguntaModel, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/preguntas/admPreguntas?Accion=e&UUID=${this.storageService.getCurrentSession().uuid}`, pregunta, { headers: headers });
  }

  /* operaciones para IMAGEN */
  consultarImagen(imagen: ImagenModel, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/imagenes/admImagenes?Accion=c&UUID=${this.storageService.getCurrentSession().uuid}`, imagen, { headers: headers });
  }

  crearImagen(imagen: ImagenModel, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/imagenes/admImagenes?Accion=i&UUID=${this.storageService.getCurrentSession().uuid}`, imagen, { headers: headers });
  }

  actualizarImagen(imagen: ImagenModel, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/imagenes/admImagenes?Accion=a&UUID=${this.storageService.getCurrentSession().uuid}`, imagen, { headers: headers });
  }
  eliminarImagen(imagen: ImagenModel, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/imagenes/admImagenes?Accion=e&UUID=${this.storageService.getCurrentSession().uuid}`, imagen, { headers: headers });
  }


  /* operaciones para REFERIDOS */
  consultarReferidos(referido: ReferidoModel, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/referidos/admReferidos?Accion=c&UUID=${this.storageService.getCurrentSession().uuid}`, referido, { headers: headers });
  }

  decargarConsolidadoReferidos(obj: String, fInicio: string, fFin: string, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    let params = new HttpParams();
    params = params.set('UUID', `${this.storageService.getCurrentSession().uuid}`);

    if (obj != undefined) {
      params = params.set('json', `${obj}`);
    }
    if (fInicio != null) {
      params = params.set('fechaInicio', fInicio);
    }
    if (fFin != null) {
      params = params.set('fechaFin', fFin);
    }

    return this.http.get(`${this.url}/referidos/descargar`, { params: params, responseType: 'blob', headers: headers });
  }

  crearReferido(referido: ReferidoModel, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/referidos/admReferidos?Accion=i&UUID=${this.storageService.getCurrentSession().uuid}`, referido, { headers: headers });
  }

  actualizarReferido(referido: ReferidoModel, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/referidos/admReferidos?Accion=a&UUID=${this.storageService.getCurrentSession().uuid}`, referido, { headers: headers });
  }

  /* operaciones para ACTUALIZACION DE DATOS */
  decargarConsolidadoUsuarios(cedula: string, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    let params = new HttpParams();
    params = params.set('UUID', `${this.storageService.getCurrentSession().uuid}`);
    if (cedula != undefined) {
      params = params.set('usuarioEditor', `${cedula}`);
    }
    return this.http.get(`${this.url}/users/descarga/admUsers?Accion=c`, { params: params, responseType: 'blob', headers: headers });
  }


  /* operaciones para ARTICULOS */
  crearArticulo(data: ProductoModel, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/productos/crudProductos?Accion=i&UUID=${this.storageService.getCurrentSession().uuid}`, data, { headers: headers });
  }

  actualizarArticulo(data: ProductoModel, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/productos/crudProductos?Accion=a&UUID=${this.storageService.getCurrentSession().uuid}`, data, { headers: headers });
  }

  consultarArticulos(data: ProductoModel, numPag: number, tamanoPag: number, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    let params = new HttpParams();
    if (numPag != undefined) {
      params = params.append('numPag', numPag.toString());
    }
    if (tamanoPag != undefined) {
      params = params.append('tamanoPag', tamanoPag.toString());
    }
    return this.http.post(`${this.url}/productos/crudProductos?Accion=c&UUID=${this.storageService.getCurrentSession().uuid}?${params.toString()}`, data, { headers: headers });
  }

  eliminarArticulo(data: ProductoModel, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/productos/crudProductos?Accion=e&UUID=${this.storageService.getCurrentSession().uuid}`, data, { headers: headers });
  }


  /* operaciones para PEDIDOS */
  crearPedido(detallePedidoModel: RequestDetallePedidoModel[], token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/pedidos/crearPedidos?UsuarioCrea=${this.cookieService.get(Constantes.CEDULA)}&UUID=${this.storageService.getCurrentSession().uuid}&cedula=${this.cookieService.get('usuario')}`, detallePedidoModel, { headers: headers });
  }
  agregarArticuloAPedido(articulo: articulosRTAModel, cantidad: number) {
    this.totalProductosSolicitados = this.totalProductosSolicitados + cantidad;
    this.totalPuntosSolicitados = this.totalPuntosSolicitados + (cantidad * articulo.puntos);
    this.pedido.push({
      cantidad: cantidad,
      idProducto: articulo.idProducto
    });
    this.pedidoDetallado.push({
      cantidad: cantidad,
      producto: articulo
    });
  }

  consultarHistoricoRedencion(request: RequestHistoricoRedencionModel
    , numPag: any
    , tamanoPag: any, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    let params = new HttpParams();
    params = params.set('UUID', `${this.storageService.getCurrentSession().uuid}`);

    if (numPag && tamanoPag) {
      params = params.set('numPagina', `${numPag}`);
      params = params.set('tamanoPagina', `${tamanoPag}`);
    }
    return this.http.post(`${this.url}/pedidos/consultaPedidos?${params.toString()}`, request, { headers: headers });
  }

  procesarArchivoActualizacionPedido(file: File, token: string): Observable<HttpEvent<any>> {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    const formData: FormData = new FormData();
    formData.append('file', file);
    let cedula = this.cookieService.get(Constantes.CEDULA);
    const req = new HttpRequest('POST', `${this.url}/pedidos/actualizarPedidos/cargarArchivo?usuarioEditor=${cedula}&UUID=${this.storageService.getCurrentSession().uuid}`, formData, {
      responseType: 'blob',
      headers: headers
    });
    return this.http.request(req);
  }

  


  /*Operacion recarga*/
  updateOparationTransfer(updateOperationTransfer: UpdateOperationTransferModel) {
    let cabecera: Cabecera = new Cabecera();
    cabecera.login = this.storageService.getValuePropiedad(Constantes.UPDATE_OPERATION_CABECERA_LOGIN);
    cabecera.password = this.storageService.getValuePropiedad(Constantes.UPDATE_OPERATION_CABECERA_PASSWORD);
    cabecera.requestGatewayCode = this.storageService.getValuePropiedad(Constantes.UPDATE_OPERATION_CABECERA_CODE);
    cabecera.requestGatewayType = this.storageService.getValuePropiedad(Constantes.UPDATE_OPERATION_CABECERA_TYPE);
    cabecera.servicePort = this.storageService.getValuePropiedad(Constantes.UPDATE_OPERATION_CABECERA_PORT);
    cabecera.sourceType = this.storageService.getValuePropiedad(Constantes.UPDATE_OPERATION_CABECERA_SOURSETYPE);
    updateOperationTransfer.cabecera = cabecera;
    updateOperationTransfer.type = this.storageService.getValuePropiedad(Constantes.UPDATE_OPERATION_TYPE);
    updateOperationTransfer.extNwCode = this.storageService.getValuePropiedad(Constantes.UPDATE_OPERATION_EXTNWCODE);
    updateOperationTransfer.pin = this.storageService.getValuePropiedad(Constantes.UPDATE_OPERATION_PIN);
    updateOperationTransfer.extCode = this.storageService.getValuePropiedad(Constantes.UPDATE_OPERATION_EXTCODE);
    updateOperationTransfer.products[0].productCode = this.storageService.getValuePropiedad(Constantes.UPDATE_OPERATION_PRODUCTS_PRODUCTCODE);
    updateOperationTransfer.trfCategory = this.storageService.getValuePropiedad(Constantes.UPDATE_OPERATION_TRFCATEGORY);
    updateOperationTransfer.refNumber = this.storageService.getValuePropiedad(Constantes.UPDATE_OPERATION_REFNUMBER);
    updateOperationTransfer.paymentDetails[0].paymentType = this.storageService.getValuePropiedad(Constantes.UPDATE_OPERATION_PAYMENTDETAILS_PAYMENTTYPE);
    updateOperationTransfer.paymentDetails[0].paymentInstNumber = this.storageService.getValuePropiedad(Constantes.UPDATE_OPERATION_PAYMENTDETAILS_PAYMENTINSTNUMBER);
    updateOperationTransfer.remarks = this.storageService.getValuePropiedad(Constantes.UPDATE_OPERATION_REMARKS);
    let url = this.storageService.getValuePropiedad(Constantes.URL_UPDATE_OPERATION_TRANSFER);
    return this.http.post(`${url}`, updateOperationTransfer);

  }


  getComprobateStateTransfer(comprobateStateTransfer: ComprobateStateTransferModel) {
    let cabecera: Cabecera = new Cabecera();
    cabecera.login = this.storageService.getValuePropiedad(Constantes.COMPROBATE_STATE_CABECERA_LOGIN);
    cabecera.password = this.storageService.getValuePropiedad(Constantes.COMPROBATE_STATE_CABECERA_PASSWORD);
    cabecera.requestGatewayCode = this.storageService.getValuePropiedad(Constantes.COMPROBATE_STATE_CABECERA_CODE);
    cabecera.requestGatewayType = this.storageService.getValuePropiedad(Constantes.COMPROBATE_STATE_CABECERA_TYPE);
    cabecera.servicePort = this.storageService.getValuePropiedad(Constantes.COMPROBATE_STATE_CABECERA_PORT);
    cabecera.sourceType = this.storageService.getValuePropiedad(Constantes.COMPROBATE_STATE_CABECERA_SOURSETYPE);
    comprobateStateTransfer.cabecera = cabecera;
    comprobateStateTransfer.type = this.storageService.getValuePropiedad(Constantes.COMPROBATE_STATE_TYPE);
    comprobateStateTransfer.extNwCode = this.storageService.getValuePropiedad(Constantes.COMPROBATE_STATE_EXTNWCODE);
    comprobateStateTransfer.catCode = this.storageService.getValuePropiedad(Constantes.COMPROBATE_STATE_CATCODE);
    comprobateStateTransfer.empCode = this.storageService.getValuePropiedad(Constantes.COMPROBATE_STATE_EMPCODE);
    comprobateStateTransfer.loginId = this.storageService.getValuePropiedad(Constantes.COMPROBATE_STATE_LOGINID);
    comprobateStateTransfer.password = this.storageService.getValuePropiedad(Constantes.COMPROBATE_STATE_PASSWORD);
    comprobateStateTransfer.extRefNum = this.storageService.getValuePropiedad(Constantes.COMPROBATE_STATE_EXTREFNUM);
    comprobateStateTransfer.data.trfCategory = this.storageService.getValuePropiedad(Constantes.COMPROBATE_STATE_DATA_TRFCATEGORY);
    comprobateStateTransfer.data.fromDate = this.storageService.getValuePropiedad(Constantes.COMPROBATE_STATE_DATA_FROMDATE);
    comprobateStateTransfer.data.fromDate = this.storageService.getValuePropiedad(Constantes.COMPROBATE_STATE_DATA_TODATE);
    let url = this.storageService.getValuePropiedad(Constantes.URL_GET_COMPROBATE_STATE);
    return this.http.post(`${url}`, comprobateStateTransfer);

  }


  /* PUNTOS */
  consultarResumenPuntos(cedula: string, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    let params = new HttpParams();
    if (cedula != undefined) {
      params = params.set('cedula', `${cedula}`);
      params = params.set('UUID', `${this.storageService.getCurrentSession().uuid}`);
    }
    return this.http.get<ResponseResumenPuntos>(`${this.url}/puntos/resumenPuntos`, { params: params, headers: headers }).subscribe((resp: ResponseResumenPuntos) => {
      if (resp.codigo == Constantes.CODIGO_EXITOSO && resp.resumenPuntoDto.length >= 1) {
        this.puntosActuales = resp.resumenPuntoDto[0].puntosRestantes
        this.puntosActuales$.next(resp.resumenPuntoDto[0].puntosRestantes);
      }
      this.resumenPuntos$.next(resp.resumenPuntoDto);
    });
  }

  consultarResumenPuntosSinSuscripcion(cedula: string, numPag: number, tamanoPag: number, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    let params = new HttpParams();
    params = params.set('UUID', `${this.storageService.getCurrentSession().uuid}`);

    if (cedula != undefined) {
      params = params.set('cedula', `${cedula}`);
    }
    if (numPag != undefined && tamanoPag != undefined) {
      params = params.set('numPag', `${numPag}`);
      params = params.set('tamanoPag', `${tamanoPag}`);
    }
    return this.http.get<ResponseResumenPuntos>(`${this.url}/puntos/resumenPuntos`, { params: params, headers: headers });
  }

  consultarPuntosVencidos(request: RequestPuntosVencidosModel, numPag: any, tamanoPag: any, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    let params = new HttpParams();
    params = params.set('UUID', `${this.storageService.getCurrentSession().uuid}`);

    if (numPag && tamanoPag) {
      params = params.set('numPag', `${numPag}`);
      params = params.set('tamanoPag', `${tamanoPag}`);
    }
    return this.http.post(`${this.url}/puntos/puntosVencidos?${params.toString()}`, request, { headers: headers });
  }


  decargarPuntosVencidos(cedula: String, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    let params = new HttpParams();
    params = params.set('UUID', `${this.storageService.getCurrentSession().uuid}`);

    if (cedula != undefined) {
      params = params.set('cedula', `${cedula}`);
    }
    return this.http.get(`${this.url}/descargar/puntosVencidos`, { params: params, responseType: 'blob', headers: headers });
  }

  decargarResumenPuntos(cedula: String, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    let params = new HttpParams();
    params = params.set('UUID', `${this.storageService.getCurrentSession().uuid}`);

    if (cedula != undefined) {
      params = params.set('cedula', `${cedula}`);
    }
    return this.http.get(`${this.url}/puntos/descargar/resumenPuntosGanados`, { params: params, responseType: 'blob', headers: headers });
  }

  decargarDetallePuntos(cedula: String, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    let params = new HttpParams();
    params = params.set('UUID', `${this.storageService.getCurrentSession().uuid}`);

    if (cedula != undefined) {
      params = params.set('cedulaUsuario', `${cedula}`);
    }
    return this.http.get(`${this.url}/puntos/canjes/descargar/detalle`, { params: params, responseType: 'blob', headers: headers });
  }

  decargarDetallePedidos(obj: String, fInicio: string, fFin: string, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    let params = new HttpParams();
    params = params.set('UUID', `${this.storageService.getCurrentSession().uuid}`);

    if (fInicio != null) {
      params = params.set('fechaInicio', fInicio);
    }
    if (fFin != null) {
      params = params.set('fechaFin', fFin);
    }

    if (obj != undefined) {
      params = params.set('json', `${obj}`);
    }
    return this.http.get(`${this.url}/pedidos/descargar/consultaPedidos`, { params: params, responseType: 'blob', headers: headers });
  }

  decargarHistoricoUsuario(request: RequestDescargaHistoricoUsuario, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    let params = new HttpParams();
    params = params.set('UUID', `${this.storageService.getCurrentSession().uuid}`);
    if (request.cedulaEditada != undefined) {
      params = params.set('cedulaEditada', `${request.cedulaEditada}`);
    }
    if (request.fechaInEdicion != null) {
      params = params.set('FechaInEdicion', `${request.fechaInEdicion}`);
    }
    if (request.fechaFinEdicion != null) {
      params = params.set('FechaFinEdicion', `${request.fechaFinEdicion}`);
    }
    if (request.activo != null) {
      params = params.set('activo', `${request.activo}`);
    }
    return this.http.get(`${this.url}/users/descargar/historico`, { params: params, responseType: 'blob', headers: headers });
  }

  getResumenPuntos$(): Observable<resumenPuntosDTO[]> {
    return this.resumenPuntos$.asObservable();
  }
  getPuntos$(): Observable<number> {
    return this.puntosActuales$.asObservable();
  }
  getPuntos(): number {
    return this.puntosActuales;
  }

  consultarPuntosGanados(request: RequestPuntosGanadosModel, numPag: any, tamanoPag: any, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    let params = new HttpParams();
    params = params.set('UUID', `${this.storageService.getCurrentSession().uuid}`);
    if (numPag && tamanoPag) {
      params = params.set('numPag', `${numPag}`);
      params = params.set('tamanoPag', `${tamanoPag}`);
    }


    return this.http.post(`${this.url}/puntos/puntosGanados?${params.toString()}`, request, { headers: headers });
  }


  actualizarEstadoPedido(detalleActualizacionPedido: DetalleActualizacionPedido[], token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/pedidos/actualizarPedidos/?usuarioEditor=${this.cookieService.get(Constantes.CEDULA)}&UUID=${this.storageService.getCurrentSession().uuid}`, detalleActualizacionPedido, { headers: headers, responseType: 'blob', });
  }

  crearPQR(request: crearPQRRequestModel, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/PQR/crear`, request, { headers: headers });
  }

  consultarPQR(request: requestConsultarPQRModel, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    let params = new HttpParams();
    params = (request && request.canal) ? params.set('canal', `${request.canal}`) : params;
    request.cedulaUsuario = this.cookieService.get(Constantes.PROP_PERFIL_LOGUEADO) == Constantes.PROP_ID_PERFIL_ADMIN ? request.cedulaUsuario : atob(this.cookieService.get('user'));

    params = (request && request.cedulaUsuario) ? params.set('cedulaUsuario', `${request.cedulaUsuario}`) : params;
    params = (request && request.estado) ? params.set('estado', `${request.estado}`) : params;
    params = (request && request.fechaRegistro) ? params.set('fechaRegistro', `${request.fechaRegistro}`) : params;
    params = (request && request.fechaRegistroFin) ? params.set('fechaRegistroFin', `${request.fechaRegistroFin}`) : params;
    params = (request && request.fechaRespuesta) ? params.set('fechaRespuesta', `${request.fechaRespuesta}`) : params;
    params = (request && request.fechaRespuestaFin) ? params.set('fechaRespuestaFin', `${request.fechaRespuestaFin}`) : params;
    params = (request && request.idCategoria) ? params.set('idCategoria', `${request.idCategoria}`) : params;
    params = (request && request.idPQR) ? params.set('idPQR', `${request.idPQR}`) : params;
    params = (request && request.motivo) ? params.set('motivo', `${request.motivo}`) : params;
    params = (request && request.tipoSolicitud) ? params.set('tipoSolicitud', `${request.tipoSolicitud}`) : params;
    params = (request && request.numPagina) ? params.set('numeroPagina', `${request.numPagina}`) : params;
    params = (request && request.tamanoPagina) ? params.set('tamanoPagina', `${request.tamanoPagina}`) : params;
    params = (request && request.tipoReporte) ? params.set('tipoReporte', `${request.tipoReporte}`) : params;

    return this.http.get(`${this.url}/PQR/consultar?${params.toString()}`, { headers: headers });
  }

  responderPQR(request: ResponderPQRRequestModel, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    return this.http.post(`${this.url}/PQR/responder`, request, { headers: headers });
  }

  decargarReportePQRS(data: HistoricoPqrsRequestModel, token: string) {
    let headers = new HttpHeaders();
    headers = headers.append('authorization', `Bearer ${token}`);
    let params = new HttpParams();
    params = params.set('UUID', `${this.storageService.getCurrentSession().uuid}`);

    return this.http.post<Blob>(`${this.url}/PQR/descargaPqrs`, data, { headers: headers, responseType: 'blob' as 'json' });
  }




  addLOG(logModel: LogModel) {
    let params = new HttpParams();
    params = params.append('Accion', Constantes.CONST_ACCION_INSERTAR);
    return this.http.post(`${Constantes.CONST_ENDPOINT_SER_GENERAL}${Constantes.CONST_RUTA_URL_LOGS}?${params.toString()}`, logModel).subscribe(resp => {
    });
  }



  LOG_REQ_RESP(request: HttpRequest<any>, response: any, fechaInicial: Date) {
    try {
      let levelLog = null;
      let cod = null;
      let desc = null;
      let textReponse: string = null;

      if (response instanceof HttpResponse) {
        levelLog = TipoLog.INFO;
        cod = response.status;
        desc = response.statusText;
        textReponse = response.status + " " + response.statusText + " " + response.url + " " + JSON.stringify(response.body).replace(/"/g, "");
      } else if (response instanceof HttpErrorResponse) {
        levelLog = TipoLog.ERROR;
        cod = Number(response.status);
        desc = response.message;
        textReponse = response.status + " " + response.statusText + " " + response.url;
      }

      let vm_log: LogModel = new LogModel(
        Constantes.CANAL_APLICACION,
        cod,
        desc,
        fechaInicial,
        new Date(),
        levelLog,
        " **Inicio consumo ip** " + window.localStorage.getItem('ip') + " **Fin consumo ip** " + request.urlWithParams + " " + JSON.stringify(request.body).replace(/"/g, "'").replace(/'/g, ""),
        textReponse.replace(/"/g, ""),
        request.url,
        (this.storageService.getCurrentSession().uuid || "" != this.storageService.getCurrentSession().uuid) ? this.storageService.getCurrentSession().uuid : "",
        this.cookieService.get(Constantes.USUARIO)

      );
      this.addLOG(vm_log);
    } catch (error) {
      console.log(error);
    }
  }

  /* OTROS */
  getPedido(): RequestDetallePedidoModel[] {
    return this.pedido;
  }
  borrarPedido() {
    this.pedido = [];
  }
  getPedidoDetallado(): PedidoDetallado[] {
    return this.pedidoDetallado;
  }
  getTotalPuntosRedimidos(): number {
    return this.totalPuntosSolicitados;
  }
  getTotalProductosRedimidos(): number {
    return this.totalProductosSolicitados;
  }

}
