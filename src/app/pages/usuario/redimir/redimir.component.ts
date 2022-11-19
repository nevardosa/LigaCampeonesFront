import { Component, ElementRef, ErrorHandler, OnInit, Renderer2, ViewChild } from '@angular/core';
import { ProductoModel, respuestaArticuloModel, articulosRTAModel } from '../../../models/articulo.model';
import { WSLigaCampeonesService } from '../../../services/wsliga-campeones.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { DetalleActualizacionPedido, RequestDetallePedidoModel, ResponseCrearPedido, ResponseHistoricoRedencionModel } from '../../../models/pedido.model';
import { CookieService } from 'ngx-cookie-service';
import { Constantes } from 'src/app/shared/Constantes';
import { StorageService } from '../../../services/storage.service';
import { GeneralService } from 'src/app/services/api-ser-general.service';
import { AuthTokenService } from 'src/app/services/auth-token.service';
import { Token } from 'src/app/models/auth/auth.model';
import { CategoriaModel, respuestaCategoriaModel } from 'src/app/models/categoria.model';
import { DatePipe } from '@angular/common';
import { ChampionsLeagueService } from 'src/app/services/champions-league.service';
import { RequestStartOrderModel } from 'src/app/models/WS_championsLeague.model';
import { PaymentDetails, Products, ResponseUpdateOperationTransfer, UpdateOperationTransferModel } from 'src/app/models/updateOperationTransfer.model';
import { ComprobateStateTransferModel, Data, ResponseComprobateStateTransfer } from 'src/app/models/comprobateStateTransfer.model';
import { HttpErrorResponse } from '@angular/common/http';


@Component({
  selector: 'app-redimir',
  templateUrl: './redimir.component.html',
  styleUrls: ['./redimir.component.css']
})
export class RedimirComponent implements OnInit {

  formaArticulo: FormGroup;
  articulo: articulosRTAModel = new articulosRTAModel();
  cargaCompleta: boolean = false;
  puntosActuales: number;
  DescripcionLarga: string;
  @ViewChild('divDescripcionLarga') div: ElementRef;
  token: string = null;

  pedidoXActualizar: DetalleActualizacionPedido[] = [];
  cantidadArticulosProcesados: number = 0;

  constructor(private activatedRoute: ActivatedRoute
    , private ligaService: WSLigaCampeonesService
    , private fb: FormBuilder
    , private router: Router
    , private cookieService: CookieService
    , private storageService: StorageService
    , private generalService: GeneralService
    , private renderer: Renderer2
    , private authTokenService: AuthTokenService
    , private datePipe: DatePipe
    , private championsLeagueService: ChampionsLeagueService) { }

  ngOnInit(): void {
    Swal.fire({
      text: 'Cargando Información',
      allowOutsideClick: false
    });
    Swal.showLoading();

    this.crearFormulario();
    this.articulo.idProducto = Number(this.activatedRoute.snapshot.paramMap.get('idProducto'));
    this.consultarArticulo(this.articulo.idProducto);
    this.setCantidadForm(Number(this.activatedRoute.snapshot.paramMap.get('cantidadRedimir')));
  }

  mostrarDescripcionLarga() {
    this.DescripcionLarga = this.articulo.informacionDetallada;
    const p: HTMLParagraphElement = this.renderer.createElement('div');
    p.innerHTML = this.DescripcionLarga;
    this.renderer.appendChild(this.div.nativeElement, p);
  }

  crearFormulario() {
    let er = new RegExp(Constantes.PATRON_SOLO_DIGITOS);
    this.formaArticulo = this.fb.group({
      cantidad: ['', Validators.compose([Validators.required
        , Validators.pattern(er)
      ])
      ],
    });
  }

  //mesnajes de validacion al formulario
  count_validation_messages = {
    'cantidad': [
      { type: 'required', message: 'Debe ingresar la cantidad a redimir' },
      { type: 'pattern', message: 'la cantidad  debe ser un valor numérico' }
    ]
  }
  validarError(formulario: any, nombreCampo: string, tipoError: any) {
    return formulario.get(nombreCampo).hasError(tipoError)
      && (formulario.get(nombreCampo).dirty || formulario.get(nombreCampo).touched)
  }

  // tslint:disable-next-line: typedef
  get cantidadNoValido() {
    return this.formaArticulo.get('cantidad').invalid && this.formaArticulo.get('cantidad').touched;
  }

  consultarArticulo(idArticulo: number) {
    let articulo = new ProductoModel();
    articulo.idProducto = idArticulo;
    this.authTokenService.authToken().subscribe((resp: Token) => {
      this.token = resp.token
      this.ligaService.consultarArticulos(articulo, 1, 1, this.token).subscribe((resp: respuestaArticuloModel) => {
        this.articulo = resp.crudProductosDto[0];
        this.articulo.imagen = (this.articulo.imagen == null || this.articulo.imagen == '') ? Constantes.IMAGEN_X_DEFECTO : this.articulo.imagen;
        this.cargaCompleta = true;
        Swal.close();
        this.mostrarDescripcionLarga();
      });
    });
  }
  addClassOpacar() {
    return (this.articulo.imagen == Constantes.IMAGEN_X_DEFECTO) ? "opacar-imagen" : "";
  }
  aumentarCantidad() {
    this.puntosActuales = this.ligaService.getPuntos();
    if (this.puntosActuales == 0 || (this.puntosARedimir() + this.articulo.puntos) > this.puntosActuales) {
      this.generalService.mostrarMensaje('Oopss.. ', 'Tus puntos actuales no te alcanzan para redimir mas unidades', 'warning');
      return;
    } else if ((this.getCantidadForm() + 1) > this.articulo.unidadesDisponibles) {
      this.generalService.mostrarMensaje('Oopss.. ', 'No hay mas unidades disponibles', 'warning');
      return;
    } else if (this.getCantidadForm() < this.articulo.unidadesDisponibles) {
      this.setCantidadForm(this.getCantidadForm() + 1);
    }

  }
  disminuirCantidad() {
    if (this.getCantidadForm() != 0 && this.getCantidadForm() > 0) {
      this.setCantidadForm(this.getCantidadForm() - 1);
    }
  }

  getCantidadForm(): number {
    return Number(this.formaArticulo.get('cantidad').value);
  }

  setCantidadForm(cantidad: number) {
    this.formaArticulo.patchValue({
      cantidad: cantidad
    });
  }
  getMinimoStock() {
    return this.articulo.unidadesDisponibles <= Number(this.storageService.getValuePropiedad(Constantes.CANTIDAD_MINIMA_ARTICULOS));
  }
  habilitarRedencion(): boolean {
    return this.getCantidadForm() != 0;
  }
  validaRedencion() {
    return this.formaArticulo.invalid || this.formaArticulo.get('cantidad').value === 0 || this.puntosARedimir() > this.puntosActuales;
  }

  terminarRedimir() {
    if (this.getCantidadForm() == 0) {
      this.generalService.mostrarMensaje('ERROR', 'Para redimir debe tener minimo 1 unidad!', 'error');
      return;
    }

    Swal.fire({
      text: '¿Estás seguro que deseas redimir (' + this.getCantidadForm() + ') ' + this.articulo.titulo + " por " + this.puntosARedimir() + " puntos?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#f53201',
      confirmButtonText: 'Aceptar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.ligaService.agregarArticuloAPedido(this.articulo, this.getCantidadForm());
        this.generalService.mostrarMensajeCarga("Redimiento");
        this.authTokenService.authToken().subscribe((resp: Token) => {
          this.token = resp.token
          this.ligaService.crearPedido(this.ligaService.getPedido(), this.token).subscribe((respCrearPedido: ResponseCrearPedido) => {
            if (respCrearPedido.codigo == Constantes.CODIGO_EXITOSO) {
              let categoria: CategoriaModel = new CategoriaModel();
              categoria.idCategoria = Number(this.articulo.idCategoria);
              categoria.nombreCategoria = null;
              this.ligaService.consultarCategorias(categoria, this.token).subscribe((respCategoria: respuestaCategoriaModel) => {
                this.ligaService.getPedido().forEach(detallePedido => {
                  switch (respCategoria.listaCategorias[0].tipoRedencion.toString()) {
                    case Constantes.CONST_REDENCION_X_RECARGA: this.updateOperationTransfer(respCrearPedido.numeroPedido, detallePedido); break;
                    // case Constantes.CONST_REDENCION_X_TERMINAL: this.realizarRedencionXTerminales(detallePedido, respCrearPedido.numeroPedido); break;
                    default: this.cantidadArticulosProcesados++;
                       this.finalizarRedencion();
                  }
                });
              });
            } else {
              this.generalService.mostrarMensaje('Error', 'Ocurrió un error, no fue posible realizar la redencion', 'error');
              return;
            }
          });

        });
      }
    });
  }
  puntosARedimir(): number {
    return ((this.getCantidadForm()) * this.articulo.puntos);
  }


  updateOperationTransfer(numeroPedido: number, detallePedido: RequestDetallePedidoModel) {
    let updateOperationTransfer: UpdateOperationTransferModel = new UpdateOperationTransferModel();
    let msg: string = null;
    updateOperationTransfer.msisdn = this.cookieService.get('celular');
    updateOperationTransfer.extTxnNumber = numeroPedido.toString();
    updateOperationTransfer.extTxnDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    let products: Products = new Products();
    products.qty = (this.articulo.costo * detallePedido.cantidad).toString();
    updateOperationTransfer.products.push(products);
    let paymentDetails: PaymentDetails = new PaymentDetails();
    paymentDetails.paymentDate = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    updateOperationTransfer.paymentDetails.push(paymentDetails)
    this.ligaService.updateOparationTransfer(updateOperationTransfer).subscribe((resp: ResponseUpdateOperationTransfer) => {

      if (resp.Command.txnStatus == "200") {
        this.ComprobateStateTransfer(numeroPedido, resp.Command.txnId, detallePedido);
      } else {
        msg = this.storageService.getValuePropiedad(Constantes.MSG_ERROR_RECARGA) + " (" + resp.Command.txnStatus + ")";
        this.getFinalizacion(numeroPedido, detallePedido, false, msg);
      }
    }, (error: HttpErrorResponse) => {
      msg = this.storageService.getValuePropiedad(Constantes.MSG_ERROR_INTERNO_RECARGA) + " " + error.status + " " + error.statusText;
      this.getFinalizacion(numeroPedido, detallePedido, false, msg);
    });
  }

  ComprobateStateTransfer(numeroPedido: number, txnId: string, detallePedido: RequestDetallePedidoModel) {
    let comprobateStateTransfer: ComprobateStateTransferModel = new ComprobateStateTransferModel();
    let msg: string = null;
    let data: Data = new Data();
    data.msisdn = this.cookieService.get('celular');
    data.transactionId = txnId;    
    comprobateStateTransfer.data = data;
    comprobateStateTransfer.date = this.datePipe.transform(new Date(), 'yyyy-MM-dd');
    this.ligaService.getComprobateStateTransfer(comprobateStateTransfer).subscribe((resp: ResponseComprobateStateTransfer) => {
      if (resp.command.txnStatus == "200") {
        msg = this.storageService.getValuePropiedad(Constantes.MSG_EXITOSO_RECARGA);
        this.getFinalizacion(numeroPedido, detallePedido, true, msg);
      } else {
        msg = Constantes.MSG_ERROR_RECARGA + " (" + resp.command.txnStatus + ")";
        this.getFinalizacion(numeroPedido, detallePedido, false, msg);
      }
    }, (error: HttpErrorResponse) => {
      msg = this.storageService.getValuePropiedad(Constantes.MSG_ERROR_INTERNO_RECARGA) + " " + error.status + " " + error.statusText;
      this.getFinalizacion(numeroPedido, detallePedido, false, msg);
    });
  }



  realizarRedencionXTerminales(detallePedido: RequestDetallePedidoModel, numeroPedido: number) {
    let requestStartOrderModel: RequestStartOrderModel = new RequestStartOrderModel();
    this.championsLeagueService.startOrder(requestStartOrderModel).subscribe((response) => {
      if (response.status != Constantes.CONST_STATUS_CODE_OK) {
        this.pedidoXActualizar.push(new DetalleActualizacionPedido(numeroPedido, detallePedido.idProducto, Constantes.CONST_ESTADO_PRODUCTO_RECHAZADO, "No fue posible realizar la redencion por terminales. Pedido rechazado"));
      }
    }, error => {
      this.pedidoXActualizar.push(new DetalleActualizacionPedido(numeroPedido, detallePedido.idProducto, Constantes.CONST_ESTADO_PRODUCTO_RECHAZADO, "No fue posible realizar la redencion por terminales. Pedido rechazado"));
    }, () => {
      this.cantidadArticulosProcesados++;
      this.finalizarRedencion();
    }
    );
  }


  getFinalizacion(numeroPedido: number, detallePedido: RequestDetallePedidoModel, estado: boolean, msg: string,) {
    let estadoRechazo: number = null;
    if (estado) {
      estadoRechazo = Constantes.CONST_ESTADO_PRODUCTO_APROBADO;
    } else {
      estadoRechazo = Constantes.CONST_ESTADO_PRODUCTO_RECHAZADO;
    }
    this.pedidoXActualizar.push(new DetalleActualizacionPedido(numeroPedido, detallePedido.idProducto, estadoRechazo, msg));
    this.cantidadArticulosProcesados++;
    this.finalizarRedencion();
  }


  finalizarRedencion() {
    if (this.cantidadArticulosProcesados != this.ligaService.getPedido().length) {
      return;
    }
    Swal.close();
    this.authTokenService.authToken().subscribe((responseToken: Token) => {
      this.token = responseToken.token
      this.ligaService.actualizarEstadoPedido(this.pedidoXActualizar, responseToken.token).subscribe(resp => {
        if (resp) {
          this.ligaService.borrarPedido();
          this.ligaService.consultarResumenPuntos(this.cookieService.get(Constantes.CEDULA), this.token);
          this.router.navigate([`/usuario/redencionFinalizada`]);
        }
      });
    });

  }

}
