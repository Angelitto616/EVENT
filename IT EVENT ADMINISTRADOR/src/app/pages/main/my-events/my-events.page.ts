import { Component, OnInit, inject } from '@angular/core';
import { Product } from 'src/app/models/product.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-my-events',
  templateUrl: './my-events.page.html',
  styleUrls: ['./my-events.page.scss'],
})
export class MyEventsPage implements OnInit {

  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);

  registeredEvents: Product[] = []; 
  loading: boolean = false;

  ngOnInit() {}

  user(): User {
    return this.utilsSvc.getFromLocalStorage('user');
  }

  ionViewWillEnter() {
    this.getRegisteredEvents();
  }

  //===== Obtener eventos registrados ======

  async getRegisteredEvents() {
    const userId = this.user().uid;
    const events: Product[] = [];
    this.loading = true;
  
    try {
      // Consultar todos los eventos en `products`
      const snapshot = await firstValueFrom(this.firebaseSvc.getCollectionData('products'));
  
      for (const eventDoc of snapshot) {
        const event = eventDoc as Product;
        const attendeesPath = `products/${event.id}/attendees`;
  
        // Verificar si el usuario está en la subcolección `attendees` del evento
        const attendee = await this.firebaseSvc.getDocument(`${attendeesPath}/${userId}`);
        
        if (attendee) {
          events.push(event); // Agregar el evento si el usuario está en la lista de asistentes
        }
      }
  
      this.registeredEvents = events; // Guardar los eventos registrados en la variable
      console.log("Eventos registrados:", this.registeredEvents);
    } catch (error) {
      console.error("Error al obtener eventos registrados:", error);
    } finally {
      this.loading = false; // Detener el estado de carga
    }
  }
  
}
