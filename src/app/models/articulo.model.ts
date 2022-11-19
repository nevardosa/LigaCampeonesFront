export class ArticuloModel{
    id: string;
    categoria: number;
    titulo: string;
    descripcion: string;
    imagen: string;
    cantidad: number;
    estado: string;
    destacado: boolean;
    redimido: boolean;
}

export class ProductoModel{
    accion                  : string;
    costos                  : number;
    descripcionCorta	    : string;
    destacado	            : number;
    estado	                : number;
    idCategoria	            : string;
    idProducto	            : number;
    imagen                  : string;
    informacionDetallada    : string;
    masRedimido	            : number;
    puntos	                : number;
    titulo                  : string;
    unidadesDisponibles	    : number;
}
//DTO utilizado para retornar la informacion de productos
export class articulosRTAModel{
    idProducto          : number;
    idCategoria         : string;
    nombreCategoria     : string;
    descripcionCorta    : string;
    imagen              : string;
    estado              : number;
    destacado           : number;
    masRedimido         : number;
    titulo              : string;
    unidadesDisponibles : number;
    costo               : number;
    puntos              :number;
    informacionDetallada: string;
}

export class respuestaArticuloModel{
    codigo            : number;
    resultado         : String;
    totalRegistros    : number;
    crudProductosDto  : articulosRTAModel[] = [];
}

export interface articulo{
    accion                  : string,
    costos                  : number,
    descripcionCorta	    : string,
    destacado	            : number,
    estado	                : number,
    idCategoria	            : number,
    idProducto	            : number,
    imagen                  : string,
    informacionDetallada    : string,
    masRedimido	            : number,
    puntos	                : number,
    titulo                  : string,
    unidadesDisponibles	    : number
}
