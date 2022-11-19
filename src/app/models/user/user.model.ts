import { strict } from 'assert';
//request de admUsuarios
export class UserModel {
    activo:number;
    apellido: string;
    barrio: string;
    cambioClave: boolean;
    canal: string;
    cedula: number;
    celular: number;
    clave: string;
    correo: string;
    direccion: string;
    fecha_nacimiento: string;
    idCiudad: number;
    idPerfil: number;
    nombres: string;
    tipoContrato: string;
}

export class responseADMUsuarios {
    codigo:number;
    resultado: string;
    cursorUsuarios: usuarioResponseADMUsuarios [] = [];
}
export class usuarioResponseADMUsuarios {
    cedula: string;
    nombres: string;
    apellido: string;
    canal: string;
    celular: number;
    correo: string;
    direccion: string;
    clave: string;
    idCiudad:number;
    barrio: string;
    fecha_nacimiento: string;
    activo: number;
    cambioClave: boolean;
    idPerfil: number;
    nombrePerfil: string;
    tipoContrato: string;
}

export class ResponseValidarUsuarioModel {
    token: String;
    codigo: number;
    descripcion: String;
    usuario: usuarioResponseValidarUsuarioModel;
}
export class usuarioResponseValidarUsuarioModel {
    cedula: string;
    nombres: string;
    apellido: string;
    canal: string;
    celular: number;
    correo: string;
    direccion: string;
    clave: string;
    idCiudad: number;
    barrio: string;
    fecha_nacimiento: string;
    activo: number;
    cambioClave: Boolean;
    idPerfil:number;
    tipoContrato: string;
}



export class UserAdminModel {
    id: string;
    nombre: string;
    apellido: string;
    tipoDocumento: string;
    documento: number;
    clave: string;
    repetirClave: string;
}

export class RedMaestraModel {
    cc: string;
}

export class respuestaRedMaestraModel {
    address: string;
    cell: string;
    city: string;
    code: string;
    departament: string;
    description: string;
    email: string;
    exist: string;
    lastName: string;
    name: string;
}

// export class ResponseCRUDUsuario {
//     codigo: number;
//     resultado: string;
//     cursorUsuarios: UserModel[] = [];
// }

export class RequestDescargaHistoricoUsuario {
    fechaFinEdicion: string;
    fechaInEdicion: string;
    activo:number;
    UUID: string;
    cedulaEditada: string;
    efectividadCambio: string;
    usuarioEditor: string;
}

export class loginSuccessModel {
    documentNumber: string;   
}