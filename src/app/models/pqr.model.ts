export class requestConsultarPQRModel {
    canal: string;
    cedulaUsuario: string;
    estado: string;
    fechaRegistro: Date;
    fechaRegistroFin : Date;
    fechaRespuesta : Date;
    fechaRespuestaFin : Date;
    idCategoria:number;
    idPQR:number;
    motivo: string;
    tipoSolicitud: string;
    numPagina: number;
    tamanoPagina: number;
    tipoReporte : string;
}
export class responseConsultaPQRModel{
    codigo: number;
    descripcion: string;
    totalRegistros: number;
    listaPqrs: PQRModel [] =  [];
}

export class PQRModel{
    nombre: string;
    apellido: string;
    cedula_usuario: string;
    canal: string;
    idPQR: number;
    fechaRegistro: Date;
    tipoSolicitud: string;
    nombreCategoria: string;
    motivo: string;
    descripcionSolicitud: string;
    idRespuesta: number;
    estado: string;
    fechaRespuesta: Date;
    descripcionRespuesta: string;
    nombreDocumentosAdjuntos:string;
}
export class ResponderPQRRequestModel{
    descripcionRespuesta: string;
    estado: string;
    idPQR: number;  
    nombreDocumentosAdjuntos: string;
}
export class responseGeneralModel{
    codigo: number;
    descripcion: string;
}

export class crearPQRRequestModel{
    cedulaUsuario:number;  
    descripcion: string;
    idCategoria: number;  
    motivo: string;
    tipoSolicitud:string;
    nombreDocumentosAdjuntos:string;
}

export class HistoricoPqrsRequestModel{
    
    cedula_usuario: string;
    estado: string;
    fechaRegistro: Date;
    fechaRegistroFin: Date;
    idCategoria: number;
    motivo: string;
    tipoReporte:string;
    tipoSolicitud: string;
}