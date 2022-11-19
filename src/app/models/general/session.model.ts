import { parametrosDTO } from '../admPerfiles/propiedades.model';

export class Session {
    public token: string;
    public uuid: string;
    public propiedades: parametrosDTO[]
}