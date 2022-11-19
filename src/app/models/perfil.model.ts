export class PerfilModel {
    idPerfil: number;
    isReferido: number;
    nombrePerfil: string;
    descripcionPerfil: string;
    canales:string;
}

export class respuestaPerfilModel {
    codigo: number;
    descripcion: string;
    listaPerfiles: PerfilModel[] = [];
}

export class PerfilxCategoria {
    idPerfil: Number;
    idCategoria: Number;
}


export class registroResponseCategoriaXPerfil{
    idCategoria: number;
    nombreCategoria: string;
    pendiente: number;
    estado:number;
    orden: number;
    tipoRedencion: number;
    idPerfil: number;
}
export class responseCategoriaXPerfil{
    codigo: number;
    descripcion: string;
    listaPerfilesXCategoria: registroResponseCategoriaXPerfil[] = [];
}

// export class respuestaPerfilxCategoria {
//     codigo: number;
//     descripcion: string;
//     listaPerfilesXCategoria: PerfilxCategoria[] = [];
// }


export class AuxTablaPerfilxCategoria {
    idCategoria: number;
    idPerfil: number;
    nombreCategoria: string;
    nombrePerfil: string;
    check: boolean;
}
