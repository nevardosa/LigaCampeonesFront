export class ParametrosEAFRequest{
    public accion      : string;
    public canal        : string;
    public codapp       : string;
    public nombre       : string;
    public valor        : string;
}
export class parametrosDTO{
    public codapp   : string;
    public nombre   : string;
    public valor    : string;
}
export class cursorparametros{
    public parametros : parametrosDTO[] = [];
}
export class ParametrosEAFResponse{
    public codigo               : number;
    public descripcion          : string;
    public cursorparametros     : cursorparametros;
}

export class imagenesDTO{
    public codapp   : string;
    public nombre   : string;
    public descripcion   : string;
    public img    : string;
}

export class contratosDTO{
    public id   : number;
    public name   : string;
    public desc : string;
    public terminos   : string;
}
export class cursorContratos{
    public contratos : contratosDTO[] = [];
}

export class cursorCorreos{
    public correos : correosDTO[] = [];
}
export class correosDTO{
    public id   : number;
    public name   : string;
    public structure : any; 
    public showrecipent: boolean;   
}
export class param{
    public id:number;
    public value:string;
}