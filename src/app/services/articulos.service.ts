import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ArticuloModel } from '../models/articulo.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ArticulosService {

  private urlArticulo = 'https://crud-articulos-598e7.firebaseio.com';
  constructor(private http: HttpClient) { }

// tslint:disable-next-line: typedef
eliminarArticulo( id: string){
  return this.http.delete(`${ this.urlArticulo }/articulos/${ id }.json`);
}

// tslint:disable-next-line: typedef
crearArticulo(articulo: ArticuloModel){
    return this.http.post(`${ this.urlArticulo }/articulos.json`, articulo);
  }

// tslint:disable-next-line: typedef
actualizarArticulo(articulo: ArticuloModel){
    return this.http.put(`${ this.urlArticulo }/articulos/${ articulo.id }.json`, articulo);
  }

// tslint:disable-next-line: typedef
consultarArticulos(){
    return this.http.get(`${ this.urlArticulo }/articulos.json`).pipe(
      map( this.crearArreglo)
    );
  }

  // tslint:disable-next-line: typedef
  private crearArreglo( articulosObj: object){
    if (articulosObj === null){
      return [];
    }else{
      const ARTICULOS: ArticuloModel [] = [];
      Object.keys( articulosObj).forEach( key => {
        const ARTICULO: ArticuloModel = articulosObj[key];
        ARTICULO.id = key;
        ARTICULOS.push(ARTICULO);
      });
      return ARTICULOS;
    }
  }
}
