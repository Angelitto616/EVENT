import { Component, inject, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';

@Component({
  selector: 'app-asistencia',
  templateUrl: './asistencia.page.html',
  styleUrls: ['./asistencia.page.scss'],
})
export class AsistenciaPage implements OnInit {

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);

  loading = false; // Indicador de carga
  attendances: any[] = []; // Array para almacenar los datos de 'attendances'

  ngOnInit() {
    this.getAttendances(); // Obtener datos al iniciar el componente
  }

  // ===== Método para obtener datos de la colección 'attendances' =====
  async getAttendances() {
    this.loading = true; // Activar estado de carga

    try {
      // Obtener datos de la colección 'attendances'
      const snapshot = await firstValueFrom(this.firebaseSvc.getCollectionData('attendances'));
      
      // Guardar los datos obtenidos en la variable
      this.attendances = snapshot.map((doc: any) => ({
        id: doc.id, // ID del documento
        charla: doc.charla,
        email: doc.email,
        fecha: doc.fecha,
        rut: doc.rut,
        timestamp: doc.timestamp,
      }));

      console.log('Asistencias obtenidas:', this.attendances);
    } catch (error) {
      console.error('Error al obtener asistencias:', error);
    } finally {
      this.loading = false; // Desactivar estado de carga
    }
  }
}
