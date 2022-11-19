export class LugaresModel{
    centroDistribucion: string;
    codigoDane: number;
    departamento: number;
    nombreLugar: string;
}

export class RespuestaLugaresModel{
    codigo: number;
    descripcion: string;
    lugares: LugaresModel[] = [];
}
