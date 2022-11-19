export class ReferidoModel {
    cedula: string;
    cedulaQuienRefiere: string;
    fechaCreacion: Date;
    dirreccion: string;
    idCiudad: number;
    idDepartamento: number;
    nombreCiudad: string;
    nombreDepartamento: string; 
    idReferido: number;
    nombre: string;
    nombreQuienRefiere: string;
    producto: string;
    segmento: string;
    telefono2: number;
    telefonoCelular: number;   
}


export class respuestaReferidoModel {
    codigo: number;
    descripcion: string;
    listaReferidos: ReferidoModel[] = [];
}