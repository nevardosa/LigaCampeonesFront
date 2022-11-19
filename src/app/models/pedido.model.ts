import { articulosRTAModel } from '../models/articulo.model';

export class PedidoModel{
    cantidad: number;
    categoria: string;
    cedula: number;
    ciudad: string;
    correo: string;
    costo: number;
    puntos: number;
    departamento: string;
    direccion: string;
    efectivo: string;
    fecha: string;
    motivoRechazo: string;
    nombre: string;
    notas: string;
    producto: string;
    telefono: number;
}

export class RequestDetallePedidoModel{
    cantidad        : number;
    idProducto      : number; 
}
export class ResponseCrearPedido{
    numeroPedido    :number;
    codigo          : number;
    descripcion     : string;
}

export class PedidoDetallado{
    cantidad        : number;
    producto        : articulosRTAModel;
}


/*------  HISTORICO DE REDENCION  ------*/
export class RequestHistoricoRedencionModel{
    cedula          : string;
    celular         : string;
    ciudad          : string;
    correo          : string;
    departamento    : string;
    estado          : string;
    fechaPedido     : Date;
    idCiudad        : number;
    idDepartamento  : number;
    idProducto      : number;
    nombre          : string;
    numeroPedido    : number;
    producto        : string
}
export interface Pedido{
    cedula          : string;
    celular         : string;
    ciudad          : string;
    correo          : string;
    departamento    : string;
    estado          : string;
    fechaPedido     : Date;
    idCiudad        : number;
    idDepartamento  : number;
    idProducto      : number;
    nombre          : string;
    numeroPedido    : number;
    producto        : string
}
export class DTOHistoricoRedencionModel{
    cedulaUsuario           : string;
    celular                 : number;
    nombre                  : string;
    apellido                : string;
    fecha_nacimiento        : Date;
    correo                  : string;
    direccion               : string;
    numeroPedido            : number;
    fechaPedido             : Date;
    idCategoria             : number;
    nombreCategoria         : string;
    nombreProducto          : string;
    puntos                  : number;
    cantidad                : number;
    estado                  : string;
    motivoRechazo           : string;
    idDepartamento          : number;
    departamento            : string;
    idCiudad                : number;
    ciudad                  : string;
    descripcionCortaProducto: string;
    informacionDetalladaProducto: string;
    costo                   : number;
}   
export class ResponseHistoricoRedencionModel{
    resultado       : string;
    codigo          : number;
    totalRegistros  : number;
    outHistoricoRedencionDto : DTOHistoricoRedencionModel[] = [];
}


/*---------------------  ACTUALIZACION DE PEDIDOS  ------*/
export class DetalleActualizacionPedido{
    idProducto          : number;
    idPedido            : number;
    estado              : number;
    motivoRechazo       : string;
    constructor(idPedido : number, idProducto : number,  estado : number, motivoRechazo : string){
        this.idProducto    = idProducto;
        this.idPedido      = idPedido;
        this.estado        = estado;
        this.motivoRechazo = motivoRechazo;
    }
}