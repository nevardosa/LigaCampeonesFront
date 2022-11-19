import { NgModule, Component } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PagesComponent } from './pages/pages.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { HomeComponent } from './pages/usuario/home/home.component';
import { AuthGuard } from './services/auth.guard';
import { PedidoComponent } from './pages/admin/pedido/pedido.component';
import { CargaArchivoComponent } from './pages/admin/carga-archivo/carga-archivo.component';
import { ArticuloComponent } from './pages/admin/articulo/articulo.component';
import { ArticuloActualizarComponent } from './pages/admin/articulo/articulo-actualizar.component';
import { ActualizacionUsuarioComponent } from './pages/admin/actualizacion-usuario/actualizacion-usuario.component';
import { ConsultarInformacionComponent } from './pages/admin/actualizacion-usuario/consultar-informacion.component';
import { AdministradorComponent } from './pages/admin/administrador/administrador.component';
import { AdministradorEditarComponent } from './pages/admin/administrador/administrador-editar.component';
import { PuntosCanjesComponent } from './pages/admin/puntos-canjes/puntos-canjes.component';
import { PerfilAdministradorGuard } from './services/perfil-administrador.guard';
import { PerfilUsuarioGuard } from './services/perfil-usuario.guard';
import { RedimirComponent } from './pages/usuario/redimir/redimir.component';
import { RedencionFinalizadaComponent } from './pages/usuario/redimir/redencion-finalizada.component';
import { CuentaComponent } from './pages/usuario/cuenta/cuenta.component';
import { InformacionComponent } from './pages/usuario/informacion/informacion.component';
import { GaleriaArticulosComponent } from './pages/usuario/galeria-articulos/galeria-articulos.component';
import { CategoriaComponent } from './pages/admin/categoria/categoria.component';
import { ReferidoComponent } from './pages/admin/referido/referido.component';
import { ReferidoUsuarioComponent } from './pages/usuario/referido/referido-usuario.component';
import { ChangePassComponent } from './auth/change-pass/change-pass.component';
import { ParametrizacionComponent } from './pages/admin/parametrizacion/parametrizacion.component';
import { PreguntasComponent } from './pages/usuario/preguntas/preguntas.component';
import { ComponenteFlotanteComponent } from './shared/componente-flotante/componente-flotante.component';
import { TerminosYCondicionesComponent } from './pages/admin/terminos-ycondiciones/terminos-ycondiciones.component';
import { PerfilComponent } from './pages/admin/perfil/perfil.component';
import { PerfilActualizarComponent } from './pages/admin/perfil/perfil-actualizar.component';
import { ParametrizacionesComponent } from './pages/admin/parametrizaciones/parametrizaciones.component';
import { PqrsComponent } from './pages/pqrs/pqrs.component';
import { DetallePqrComponent } from './pages/pqrs/detalle-pqr.component';

const routes: Routes = [
  {path: 'login', component: LoginComponent},
  {path: 'cambiarContrasena/:token', component: ChangePassComponent,canActivate: [ AuthGuard ]},
  {path: 'terminos', component: TerminosYCondicionesComponent  },
  {path: 'register/:cedula', component: RegisterComponent},
  {
    path: '',
    component: PagesComponent,
    canActivate: [ AuthGuard ],
    children: [
      {
        path: 'administrador',
        canActivate: [ PerfilAdministradorGuard ],
        children: [
          {path: 'pedido', component: PedidoComponent  },
          {path: 'cargaArchivo', component: CargaArchivoComponent  },
          {path: 'articulo', component: ArticuloComponent  },
          {path: 'articulo/:id', component: ArticuloActualizarComponent  },
          {path: 'actualizacionUsuario/:id', component: ActualizacionUsuarioComponent  },
          {path: 'consultarInformacion', component: ConsultarInformacionComponent  },
          {path: 'administrador', component: AdministradorComponent  },
          {path: 'administrador/:id', component: AdministradorEditarComponent  },
          {path: 'puntosCanjes', component: PuntosCanjesComponent  },
          {path: 'categorias', component: CategoriaComponent  },
          {path: 'referidos', component: ReferidoComponent  },
          {path: 'parametrizaciones', component: ParametrizacionesComponent  },
          {path: 'parametrizacion', component: ParametrizacionComponent  },          
          {path: 'perfiles', component: PerfilComponent  },  
          {path: 'perfiles/:id', component: PerfilActualizarComponent  },    
          {path: 'pqrs', component: PqrsComponent  },          
          {path: 'pqrs/:id', component: DetallePqrComponent},          
          {path: '', pathMatch: 'full', redirectTo: '/administrador/pedido'},
          {path: '**', pathMatch: 'full', redirectTo: '/administrador/pedido'}
        ]
        
      },
      {
        path: 'usuario',
        canActivate: [ PerfilUsuarioGuard ],
        children: [
          {path: 'inicio', component: HomeComponent},
          {path: 'redimir/:idProducto/:cantidadRedimir', component: RedimirComponent},
          {path: 'redencionFinalizada', component: RedencionFinalizadaComponent},
          {path: 'cuenta', component: CuentaComponent},
          {path: 'informacion', component: InformacionComponent},
          {path: 'preguntas', component: PreguntasComponent},
          {path: 'galeriaArticulos/:idCategoria', component: GaleriaArticulosComponent},
          {path: 'referido', component:ReferidoUsuarioComponent},
          {path: 'pqrs', component: PqrsComponent  },          
          {path: 'pqrs/:id', component: DetallePqrComponent},          
          {path: '', pathMatch: 'full', redirectTo: '/usuario/inicio'},
          {path: '**', pathMatch: 'full', redirectTo: '/usuario/inicio'}
        ]
      },
      {path:'', redirectTo:'login', pathMatch:'full'},
      {path:'**', component: LoginComponent}
    ]
  }
];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forRoot(routes, { useHash: true })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
