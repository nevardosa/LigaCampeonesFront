import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { Globals } from './globals';
import { CommonModule } from '@angular/common';  

import { AppComponent } from './app.component';
import { HeaderComponent } from './shared/header/header.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { PagesComponent } from './pages/pages.component';
import { HomeComponent } from './pages/usuario/home/home.component';
import { FooterComponent } from './shared/footer/footer.component';

import { PuntosCanjesComponent } from './pages/admin/puntos-canjes/puntos-canjes.component';
import { AdministradorComponent } from './pages/admin/administrador/administrador.component';
import { CargaArchivoComponent } from './pages/admin/carga-archivo/carga-archivo.component';
import { ActualizacionUsuarioComponent } from './pages/admin/actualizacion-usuario/actualizacion-usuario.component';
import { ArticuloComponent } from './pages/admin/articulo/articulo.component';

import { CookieService } from 'ngx-cookie-service';
import { RedimirComponent } from './pages/usuario/redimir/redimir.component';
import { CuentaComponent } from './pages/usuario/cuenta/cuenta.component';
import { InformacionComponent } from './pages/usuario/informacion/informacion.component';
import { ArticuloActualizarComponent } from './pages/admin/articulo/articulo-actualizar.component';

import { ComponentesModule } from './shared/componentes/componentes.module';
import { RedencionFinalizadaComponent } from './pages/usuario/redimir/redencion-finalizada.component';
import { GaleriaArticulosComponent } from './pages/usuario/galeria-articulos/galeria-articulos.component';
import { PedidoComponent } from './pages/admin/pedido/pedido.component';

import { AppHttpInterceptor } from '../app/shared/AppHttpInterceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AdministradorEditarComponent } from './pages/admin/administrador/administrador-editar.component';

import { CoreModule } from "./services/core.module";
import { ConsultarInformacionComponent } from './pages/admin/actualizacion-usuario/consultar-informacion.component';

import { RxReactiveFormsModule } from "@rxweb/reactive-form-validators"
import { AngularEditorModule } from '@kolkov/angular-editor';

import { NgxPaginationModule } from 'ngx-pagination';

//Modulo Angular Material
import {MatExpansionModule} from '@angular/material/expansion';
import { BnNgIdleService } from 'bn-ng-idle';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DialogSesionComponent } from './shared/dialogo/dialog-sesion/dialog-sesion.component';
import { DialogComponent } from './shared/dialogo/dialog/dialog.component';
import { CategoriaComponent } from './pages/admin/categoria/categoria.component';
import { ReferidoComponent } from './pages/admin/referido/referido.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {MatListModule} from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { ReferidoUsuarioComponent } from './pages/usuario/referido/referido-usuario.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatTabsModule} from '@angular/material/tabs';
import { DatePipe } from '@angular/common';
import { ChangePassComponent } from './auth/change-pass/change-pass.component';
import { ParametrizacionComponent } from './pages/admin/parametrizacion/parametrizacion.component';
import { MatPaginatorModule, MatPaginatorIntl } from '@angular/material/paginator';
import { CustomMatPaginatorIntl } from './shared/paginator/paginador-es';
import { PreguntaFrecuentesComponent } from './pages/admin/parametrizacion/preguntas-frecuentes/pregunta-frecuentes.component';
import { PreguntasComponent } from './pages/usuario/preguntas/preguntas.component';
import { ComponenteFlotanteComponent } from './shared/componente-flotante/componente-flotante.component';
import { TerminosYCondicionesComponent } from './pages/admin/terminos-ycondiciones/terminos-ycondiciones.component';
import { PerfilComponent } from './pages/admin/perfil/perfil.component';
import { PerfilActualizarComponent } from './pages/admin/perfil/perfil-actualizar.component';
import { ParametrizacionesComponent } from './pages/admin/parametrizaciones/parametrizaciones.component';
import { PqrsComponent } from './pages/pqrs/pqrs.component';
import { DetallePqrComponent } from './pages/pqrs/detalle-pqr.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    LoginComponent,
    RegisterComponent,
    ChangePassComponent,
    PagesComponent,
    HomeComponent,
    FooterComponent,
    PedidoComponent,
    PuntosCanjesComponent,
    AdministradorComponent,
    CargaArchivoComponent,
    ActualizacionUsuarioComponent,
    ArticuloComponent,
    RedimirComponent,
    CuentaComponent,
    InformacionComponent,
    ArticuloActualizarComponent,
    RedencionFinalizadaComponent,
    GaleriaArticulosComponent,
    AdministradorEditarComponent,
    ConsultarInformacionComponent,
    DialogSesionComponent,
    DialogComponent,
    ParametrizacionesComponent,
    CategoriaComponent,
    ReferidoComponent,
    ReferidoUsuarioComponent,
    ParametrizacionComponent,
    PreguntaFrecuentesComponent,
    PreguntasComponent,
    ComponenteFlotanteComponent,
    TerminosYCondicionesComponent,
    PerfilComponent,
    PerfilActualizarComponent,
    PqrsComponent,
    DetallePqrComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    ReactiveFormsModule,
    RxReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    ComponentesModule,
    CoreModule,
    AngularEditorModule,
    NgxPaginationModule,
    BrowserAnimationsModule,
    MatDialogModule,
    MatSlideToggleModule,
    MatInputModule,
    MatCheckboxModule,
    MatTableModule, 
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule, 
    MatFormFieldModule,
    MatPaginatorModule,
    MatExpansionModule,
    MatListModule,
    HttpClientModule,
    MatTabsModule,
  ],
  
  providers: [
    Globals,
    CookieService,
    DatePipe,
    { provide: HTTP_INTERCEPTORS, useClass: AppHttpInterceptor, multi: true },
    {
      provide: MatPaginatorIntl,
      useClass: CustomMatPaginatorIntl
    },
    BnNgIdleService   
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
