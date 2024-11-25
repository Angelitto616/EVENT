import { Component, inject, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { Product } from 'src/app/models/product.model';


@Component({
  selector: 'app-add-update-product',
  templateUrl: './add-update-product.component.html',
  styleUrls: ['./add-update-product.component.scss'],
})
export class AddUpdateProductComponent implements OnInit {

  @Input() product: Product;

  form = new FormGroup({
    id: new FormControl(''),
    Image: new FormControl('', [Validators.required]),
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    descripcion: new FormControl('', [Validators.required, Validators.minLength(3)]),
    fecha: new FormControl('', [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)]),
    hora: new FormControl('', [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)]),
    dirreccion: new FormControl('', [Validators.required, Validators.minLength(3)])
  });


  fireBaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);
  user = {} as User;


  ngOnInit() {

    this.user = this.utilsSvc.getFromLocalStorage('user');
    if (this.product) this.form.setValue(this.product);


  }


  // tomar o seleccionar una imagen

  async takeImage() {

    const DataUrl = (await this.utilsSvc.takePicture('Imagen del evento')).dataUrl;
    this.form.controls.Image.setValue(DataUrl);


  }




  submit() {

    if (this.form.valid) {

      if (this.product) this.updateProduct();
      else this.createProduct();
    }

  }


  //== Crear producto ==



  // async createProduct() {

  //   let path = `users/${this.user.uid}/products`

  //   const loading = await this.utilsSvc.loading();
  //   await loading.present();

  async createProduct() {
    let path = `products`; // Cambia esta ruta para acceder a la colección compartida
    const loading = await this.utilsSvc.loading();
    await loading.present();

    





    //== subir la imagen y obtener la url ==

    let dataUrl = this.form.value.Image;
    // let imagePath = `${this.user.uid}/${Date.now()}`;
    let imagePath = `products/${Date.now()}`; // Guarda la imagen en una carpeta de productos
    let imageUrl = await this.fireBaseSvc.uploadImage(imagePath, dataUrl);
    this.form.controls.Image.setValue(imageUrl);

    delete this.form.value.id


    this.fireBaseSvc.addDocument(path, this.form.value).then(async res => {

      this.utilsSvc.dismissModal({ success: true });


      this.utilsSvc.presentToast({

        message: 'Evento creado exitosamente',
        duration: 1500,
        color: 'primary',
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


  //== Actualizar producto ==


  async updateProduct() {
    // Ruta del producto en la colección compartida
    let path = `products/${this.product.id}`; 
  
    // Verificar que el ID del producto exista
    if (!this.product || !this.product.id) {
      console.error("No se puede actualizar el producto: ID no encontrado.");
      return;
    }
  
    const loading = await this.utilsSvc.loading();
    await loading.present();
  
    try {
      // Verificar si la imagen cambió
      if (this.form.value.Image !== this.product.Image) {
        // Obtener el dataUrl de la nueva imagen
        let dataUrl = this.form.value.Image;
        
        // Obtener la ruta de almacenamiento para la nueva imagen
        let imagePath = await this.fireBaseSvc.getFilePath(this.product.Image);
        
        // Subir la nueva imagen y obtener su URL
        let imageUrl = await this.fireBaseSvc.uploadImage(imagePath, dataUrl);
        
        // Actualizar el campo Image en el formulario con la nueva URL
        this.form.controls.Image.setValue(imageUrl);
      }
  
      // Eliminar el campo `id` para evitar conflictos en la actualización
      delete this.form.value.id;
  
      // Actualizar el documento en la colección `products`
      await this.fireBaseSvc.updateDocument(path, this.form.value);
      
      // Cerrar el modal y mostrar el mensaje de éxito
      this.utilsSvc.dismissModal({ success: true });
      this.utilsSvc.presentToast({
        message: 'Evento actualizado exitosamente',
        duration: 1500,
        color: 'success',
        position: 'middle',
        icon: 'checkmark-circle-outline'
      });
    } catch (error) {
      console.log(error);
      // Mostrar mensaje de error
      this.utilsSvc.presentToast({
        message: error.message,
        duration: 2500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
    } finally {
      // Cerrar el loading después de completar el proceso
      loading.dismiss();
    }
  }
  






}