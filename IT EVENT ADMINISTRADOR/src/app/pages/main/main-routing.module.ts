import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MainPage } from './main.page';

const routes: Routes = [
  {
    path: '',
    component: MainPage,
    children: [
      {
        path: 'home',
        loadChildren: () => import('./home/home.module').then(m => m.HomePageModule),
      },
      {
        path: 'profile',
        loadChildren: () => import('./profile/profile.module').then(m => m.ProfilePageModule),
      },
      {
        path: 'my-events',
        loadChildren: () => import('./my-events/my-events.module').then(m => m.MyEventsPageModule),
      },
      {
        path: 'asistencia', // Mover esta ruta dentro de los hijos
        loadChildren: () => import('./asistencia/asistencia.module').then(m => m.AsistenciaPageModule),
      },
      {
        path: '', // Redirigir al home por defecto
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MainPageRoutingModule {}

