export class CategoriaModel {
    estado: number;
    idCategoria: number;
    isPendiente: number;
    nombreCategoria: string;
    orden: number;
    tipoRedencion: number; 
    listaMotivoPqrs: string;
}

export class respuestaCategoriaModel {
    codigo: number;
    descripcion: string;
    listaCategorias: CategoriaModel[] = [];
}