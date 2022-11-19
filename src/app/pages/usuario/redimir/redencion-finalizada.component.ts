import { Component, OnInit } from '@angular/core';
import { Constantes } from 'src/app/shared/Constantes';
import { PedidoDetallado } from '../../../models/pedido.model';
import { WSLigaCampeonesService } from '../../../services/wsliga-campeones.service';

@Component({
  selector: 'app-redencion-finalizada',
  templateUrl: './redencion-finalizada.component.html'
})
export class RedencionFinalizadaComponent implements OnInit {

  pedidoDetallado : PedidoDetallado[] = []; 
  totalProductos  : number = 0;
  totalPuntos     : number = 0;

  constructor( private ligaService: WSLigaCampeonesService) { }

  ngOnInit(): void {
    this.pedidoDetallado = this.ligaService.getPedidoDetallado();
    this.totalPuntos = this.ligaService.getTotalPuntosRedimidos();
    this.totalProductos = this.ligaService.getTotalProductosRedimidos();
    
  }
  addClassOpacar(articulo: any){
    return (articulo.imagen == Constantes.IMAGEN_X_DEFECTO)? "opacar-imagen":"";
  }
}
