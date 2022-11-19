export class ImagenModel {
    id: number;
    imagen: string;
    seccion: string;
    idSeccion: number;
    accion: number;
}
export class respuestImagenModel {
    codigo: number;
    descripcion: string;
    listaImagenes: ImagenModel[] = [];
}