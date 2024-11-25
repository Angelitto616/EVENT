import { Component, inject, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { Product } from 'src/app/models/product.model';


@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {

  fireBaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);

  ngOnInit() {
  }

  

  user(): User {
    return this.utilsSvc.getFromLocalStorage('user');
  }


  // tomar o seleccionar una imagen

  async takeImage() {

    let user = this.user();
    let path = `users/${user.uid}` 


    const dataUrl = (await this.utilsSvc.takePicture('Imagen del perfil')).dataUrl;

    const loading = await this.utilsSvc.loading();
    await loading.present();


    let imagePath = `${user.uid}/profile`;
    user.imagen= await this.fireBaseSvc.uploadImage(imagePath, dataUrl);

    this.fireBaseSvc.updateDocument(path, {imagen: user.imagen}).then(async res => {

      this.utilsSvc.saveInLocalStorage('user',user);

      this.utilsSvc.presentToast({

        message: 'Imagen Actualizada exitosamente',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline '

      })

    }).catch(error => {
      console.log(error);

      this.utilsSvc.presentToast({

        message: error.message,
        duration: 2500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline '

      })

    }).finally(() => {
      loading.dismiss();
    })
    

  }


}
