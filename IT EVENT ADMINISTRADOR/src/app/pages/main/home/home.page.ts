import { Component, ElementRef, Inject, inject, OnInit, ViewChild } from '@angular/core';
import html2canvas from 'html2canvas';
import { Product } from 'src/app/models/product.model';
import { User } from 'src/app/models/user.model';
import { FirebaseService } from 'src/app/services/firebase.service';
import { UtilsService } from 'src/app/services/utils.service';
import { AddUpdateProductComponent } from 'src/app/shared/components/add-update-product/add-update-product.component';
import Swiper from 'swiper';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { LoadingController, ModalController, Platform } from '@ionic/angular';
import { BarcodeScanningModalComponent } from './barcode-scanning-modal.component';
import { LensFacing, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';


@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {


  firebaseSvc = inject(FirebaseService);
  utilsSvc = inject(UtilsService);
  modalController = inject(ModalController);
  platfrom = inject(Platform);
  loadingController = inject(LoadingController);

  products: Product[] = [];
  loading: boolean = false;
  isAdmin: boolean = false;

  scanResult = '';



  

  ngOnInit() {
    this.checkAdminStatus();
  
    if (this.platfrom.is('capacitor')) {
      this.initializeBarcodeScanner();
    }
    
  }


  
  
  private async initializeBarcodeScanner(): Promise<void> {
    try {
      // Verificar si BarcodeScanner es compatible
      const isSupported = await BarcodeScanner.isSupported();
      if (!isSupported) {
        console.warn('BarcodeScanner no es compatible con este dispositivo.');
        return;
      }
  
      // Verificar permisos de la cámara
      const permissionStatus = await BarcodeScanner.checkPermissions();
      if (permissionStatus.camera !== 'granted') {
        const requestStatus = await BarcodeScanner.requestPermissions();
        if (requestStatus.camera !== 'granted') {
          console.error('Permiso de cámara denegado.');
          return;
        }
      }
  
      // Limpiar listeners previos
      await BarcodeScanner.removeAllListeners();
    } catch (error) {
      console.error('Error al inicializar BarcodeScanner:', error);
    }
  }
  



  async checkAdminStatus() {
    const user = this.utilsSvc.getFromLocalStorage('user');
    this.isAdmin = user?.uid === 'ZhNqNWAwRQQ92oDZ93wwyS1UPis2';
  }


  user(): User {
    return this.utilsSvc.getFromLocalStorage('user');
  }

  ionViewWillEnter() {
    this.getProducts();


  }


  //===== Obtener productos ======

  getProducts() {
    let path = `products`;
    this.loading = true;
    let sub = this.firebaseSvc.getCollectionData(path).subscribe({
      next: (res: any) => {
        console.log(res);
        this.products = res;
        this.loading = false;

        sub.unsubscribe();
      }
    });
  }



  //===== agregar o actualizar evento ======

  async addUpdateProduct(product?: Product) {

    let success = await this.utilsSvc.presentModal({
      component: AddUpdateProductComponent,
      cssClass: 'add-update-modal',
      componentProps: { product }

    })

    if (success) this.getProducts();
  }



  //== confirmaer la Eliminacion del evento ==


  async confirmDeleteProduct(product: Product) {
    this.utilsSvc.presentAlert({
      header: 'Eliminar Evento',
      message: '¿Quieres eliminar este Evento?',
      mode: 'ios',
      buttons: [
        {
          text: 'Cancelar',
        }, {
          text: 'Si, Eliminar',
          handler: () => {
            this.deleteProduct(product)
          }
        }
      ]
    });

  }






  //== Eliminar producto ==


  async deleteProduct(product: Product) {


    let path = `products/${product.id}`;

    const loading = await this.utilsSvc.loading();
    await loading.present();

    let imagePath = await this.firebaseSvc.getFilePath(product.Image);
    await this.firebaseSvc.deleteFile(imagePath);


    this.firebaseSvc.deleteDocument(path).then(async res => {

      this.products = this.products.filter(p => p.id !== product.id);

      this.utilsSvc.presentToast({

        message: 'Evento eliminado exitosamente',
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



  async registerAttendance(productId: string) {
    const userId = this.user().uid;
    try {
      const response = await this.firebaseSvc.registerAttendance(productId, userId);

      // Mostrar el mensaje basado en la respuesta
      this.utilsSvc.presentToast({
        message: response.message,
        duration: 1500,
        color: response.success ? 'success' : 'warning',
        position: 'middle',
        icon: response.success ? 'checkmark-circle-outline' : 'alert-circle-outline'
      });
    } catch (error) {
      console.error("Error al registrar asistencia:", error);
      this.utilsSvc.presentToast({
        message: 'Error al registrar asistencia',
        duration: 2500,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
    }
  }

  // Método para el cambio de slide en Swiper
  swiperSlideChanged(e: any) {
    console.log('changed:', e);
  }





  // capturo el elemento en HTML, lo transforma a canva y luego obtenlo la imagen 

  captureScren() {

    const element = document.getElementById('qrImage') as HTMLElement;

    html2canvas(element).then((canvas: HTMLCanvasElement) => {
      
      if (this.platfrom.is('capacitor')) this.shareImage(canvas);
      else this.downloandImage(canvas);


    })
  }



  // descargar imagen desde la web  

  downloandImage(canvas: HTMLCanvasElement) {
    const link = document.createElement('a');
    link.href = canvas.toDataURL();
    link.download = 'qr.png';
    link.click();
  }

  // share image mobile



  async shareImage(canvas: HTMLCanvasElement) {
    let base64 = canvas.toDataURL();
    let path = 'qr.png';

    const loading = await this.loadingController.create({spinner: 'crescent' });
    await loading.present();


    await Filesystem.writeFile({
      path,
      data: base64,
      directory: Directory.Cache
    }).then(async (res) => {

      let uri = res.uri;

      await Share.share({ url: uri });

      await Filesystem.deleteFile({
        path,
        directory: Directory.Cache
      })
    }).finally(()=> {
      loading.dismiss();
    })
  }



  // modal 



  async startScan() {
    const modal = await this.modalController.create({
      component: BarcodeScanningModalComponent,
      cssClass: 'barcode-scanning-modal',
      showBackdrop: false,
      componentProps: {
        formats: [],
        lensFacing: LensFacing.Back
      }
    });
  
    await modal.present();
  
    const { data } = await modal.onWillDismiss();
  
    if (data) {
      this.scanResult = data?.barcode?.displayValue;
      await this.processAndStoreQRCode(); // Procesar y almacenar el QR
    }
  }
  


// Método para procesar y almacenar la información del QR
async processAndStoreQRCode() {
  if (!this.scanResult) {
    this.utilsSvc.presentToast({
      message: 'No hay datos escaneados.',
      duration: 2000,
      color: 'warning',
      position: 'middle',
      icon: 'alert-circle-outline'
    });
    return;
  }

  try {
    // Parsear los datos del código QR
    const qrData = this.parseQRCode(this.scanResult);

    if (!qrData) {
      this.utilsSvc.presentToast({
        message: 'Formato de QR inválido.',
        duration: 2000,
        color: 'danger',
        position: 'middle',
        icon: 'alert-circle-outline'
      });
      return;
    }

    // Guardar en Firebase en la colección `attendances`
    const collectionPath = 'attendances'; // Nombre de la colección en Firestore
    await this.firebaseSvc.addDocument(collectionPath, qrData);

    // Confirmación visual
    this.utilsSvc.presentToast({
      message: 'Asistencia registrada con éxito.',
      duration: 2000,
      color: 'success',
      position: 'middle',
      icon: 'checkmark-circle-outline'
    });
  } catch (error) {
    console.error('Error al guardar QR en Firebase:', error);
    this.utilsSvc.presentToast({
      message: 'Error al guardar la asistencia.',
      duration: 2000,
      color: 'danger',
      position: 'middle',
      icon: 'alert-circle-outline'
    });
  }
}



// Método para parsear el contenido del QR
parseQRCode(scanResult: string): any {
  try {
    const lines = scanResult.split('\n');
    const charla = lines[0]?.replace('CHARLA ', '').trim();
    const fecha = lines[1]?.replace('Fecha: ', '').trim();
    const rut = lines[2]?.replace('Rut: ', '').trim();
    const email = lines[3]?.replace('Email: ', '').trim();

    if (!charla || !fecha || !rut || !email) return null;

    return { charla, fecha, rut, email, timestamp: new Date() };
  } catch (error) {
    console.error('Error al parsear QR:', error);
    return null;
  }
}









}
