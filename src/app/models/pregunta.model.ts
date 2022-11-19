import { ImagenModel } from "./imagen.model";

export class PreguntaModel {
    id: number;
    tipoPregunta: string;
    pregunta: string;
    respuesta: string;
    tipoVisualizacion: number;
    listaImagenes: ImagenModel[] = [];
} 

export class respuestPreguntaModel {
    codigo: number;
    descripcion: string;
    listaPreguntas: PreguntaModel[] = [];
}