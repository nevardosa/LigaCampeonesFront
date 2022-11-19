import { UserModel } from '../user/user.model';

export class AuthModel{    
    codigo: number;
    descripcion: string;   
    usuario: UserModel;
}

export class Token{
    token: string;
}

export class ValidToken{
    codigo: number;
    valido:boolean;
}