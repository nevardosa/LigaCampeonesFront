import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TarjetaProductoComponent } from './tarjeta-producto/tarjeta-producto.component';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [TarjetaProductoComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  exports:[
    TarjetaProductoComponent
  ]
})
export class ComponentesModule { }
