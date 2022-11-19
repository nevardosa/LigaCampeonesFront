export class PuntosCanjesModel {
    cedula: number;
    puntosCanjeados: number;
    puntosGanados: number;
    puntosRestantes: number;
}
//TODO: borrar modelo al final
export class GanadosModel {
    cedulaCliente: string;
    cuenta: number;
    estado: string;
    fechaActivacion: string;
    producto: string;
    puntos: number;
}
//TODO: borrar modelo al final
export class RedimidosModel {
    especificaciones: string;
    estado: string;
    fechaRedencion: string;
    motivoRechazo: string;
    producto: number;
    puntos: number;
}

export class resumenPuntosDTO {
    cedula: string;
    puntosGanados: number;
    puntosCanjeados: number;
    puntosRestantes: number;
    puntosVencidos: number;    
}
export class ResponseResumenPuntos {
    codigo: number;
    resultado: string;
    resumenPuntoDto: resumenPuntosDTO[] = [];
    totalRegistros: number;
}
/*----- PUNTOS GANADOS ----- */
export class RequestPuntosGanadosModel {
    cedulaCliente: string;
    cedulaUsuario: string;
    cuentaMin: string;
    estado: string;
    fechaActivacionFinal: Date;
    fechaActivacionIn: Date;
    producto: string;
}
export class DTOPuntosGanadosModel {
    rNum: number
    cedulaUsuario: string;
    fechaActivacion: Date;
    producto: string;
    cedulaCliente: string;
    ctaMin: string;
    puntos: number;
    estado: string;
    descripcion: string;
}
export class ResponsePuntosGanadosModel {
    codigo: number;
    resultado: string;
    totalRegistros: number;
    outPuntosGanadosDto: DTOPuntosGanadosModel[] = [];
    
}
