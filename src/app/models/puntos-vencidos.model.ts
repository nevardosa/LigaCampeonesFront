export class RequestPuntosVencidosModel {
    cedula: string;
    fechaInicActivacion: Date;
    fechaFinActivacion: Date;
    fechaInicVencimiento: Date;
    fechaFinVencimiento: Date;
    motivoVencimiento: string;
}

export class PuntosVencidosDto {
    rnum: number;
    cedula: string;
    celular: string;
    puntosGanados: number;
    fechaActivacion: Date;
    fechaVencimiento: Date;
    puntosVencidos: number;
    motivoVencimiento: string;
    
}

export class ResponsePuntosVencidosModel {
    codigo: number;
    descripcion: String;
    totalRegistros: number;
    outPuntosVencidosDto: PuntosVencidosDto[] = [];    
}

