import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  Barcode,
  BarcodeFormat,
  BarcodeScanner,
  LensFacing,
  StartScanOptions,
} from '@capacitor-mlkit/barcode-scanning';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-barcode-scanning',
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="tertiary">
        <ion-buttons slot="end">
          <ion-button (click)="closeModal()">
            <ion-icon name="close"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div #square class="square"></div>
      <ion-fab
        *ngIf="isTorchAvailable"
        slot="fixed"
        horizontal="end"
        vertical="bottom"
      >
        <ion-fab-button (click)="toggleTorch()">
          <ion-icon name="flashlight"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [
    `
      ion-content {
        --background: transparent;
      }

      .square {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        border-radius: 16px;
        width: 200px;
        height: 200px;
        border: 6px solid white;
        box-shadow: 0 0 0 4000px rgba(0, 0, 0, 0.3);
      }
    `,
  ],
})
export class BarcodeScanningModalComponent
  implements OnInit, AfterViewInit, OnDestroy {
  @Input() public formats: BarcodeFormat[] = [];
  @Input() public lensFacing: LensFacing = LensFacing.Back;

  @ViewChild('square') public squareElement!: ElementRef<HTMLDivElement>;

  public isTorchAvailable = false;
  private listener: any;

  constructor(
    private readonly ngZone: NgZone,
    private modalController: ModalController
  ) {}

  public async ngOnInit(): Promise<void> {
    try {
      console.log('Inicializando BarcodeScanner...');

      const torchAvailability = await BarcodeScanner.isTorchAvailable();
      this.isTorchAvailable = torchAvailability.available;
      console.log('Linterna disponible:', this.isTorchAvailable);

      const permissionStatus = await BarcodeScanner.checkPermissions();
      console.log('Estado de permisos:', permissionStatus);

      if (permissionStatus.camera !== 'granted') {
        const requestStatus = await BarcodeScanner.requestPermissions();
        console.log('Permisos solicitados:', requestStatus);

        if (requestStatus.camera !== 'granted') {
          throw new Error('Permiso de cámara denegado.');
        }
      }
    } catch (error) {
      console.error('Error al inicializar BarcodeScanner:', error);
    }
  }

  public ngAfterViewInit(): void {
    setTimeout(() => {
      console.log('Iniciando escaneo...');
      this.startScan();
    }, 250);
  }

  public ngOnDestroy(): void {
    console.log('Deteniendo escaneo antes de destruir el componente...');
    this.stopScan();
  }

  public async closeModal(barcode?: Barcode): Promise<void> {
    try {
      if (barcode) {
        console.log('Código escaneado:', barcode);
      } else {
        console.warn('Modal cerrado sin código válido.');
      }

      if (this.listener) {
        await this.listener.remove();
        console.log('Listener eliminado.');
      }
    } catch (error) {
      console.error('Error al eliminar el listener:', error);
    } finally {
      this.modalController.dismiss({ barcode });
      console.log('Modal cerrado.');
    }
  }

  public async toggleTorch(): Promise<void> {
    try {
      console.log('Activando/Desactivando linterna...');
      await BarcodeScanner.toggleTorch();
    } catch (error) {
      console.error('Error al activar/desactivar la linterna:', error);
    }
  }

  private async startScan(): Promise<void> {
    try {
      document.querySelector('body')?.classList.add('barcode-scanning-active');

      const options: StartScanOptions = {
        formats: this.formats,
        lensFacing: this.lensFacing,
      };

      const boundingClientRect = this.squareElement.nativeElement.getBoundingClientRect();
      console.log('Rectángulo de detección:', boundingClientRect);

      const scaledRect = boundingClientRect
        ? {
            left: boundingClientRect.left * window.devicePixelRatio,
            top: boundingClientRect.top * window.devicePixelRatio,
            right: boundingClientRect.right * window.devicePixelRatio,
            bottom: boundingClientRect.bottom * window.devicePixelRatio,
          }
        : null;

      const detectionCornerPoints = scaledRect
        ? [
            [scaledRect.left, scaledRect.top],
            [scaledRect.right, scaledRect.top],
            [scaledRect.right, scaledRect.bottom],
            [scaledRect.left, scaledRect.bottom],
          ]
        : null;

      this.listener = await BarcodeScanner.addListener(
        'barcodeScanned',
        async (event) => {
          this.ngZone.run(() => {
            console.log('Evento recibido:', event);

            const cornerPoints = event.barcode.cornerPoints;

            if (
              detectionCornerPoints &&
              cornerPoints &&
              this.isOutsideDetectionArea(detectionCornerPoints, cornerPoints)
            ) {
              console.warn('Código fuera del área de detección');
              return;
            }

            this.closeModal(event.barcode);
          });
        }
      );

      await BarcodeScanner.startScan(options);
      console.log('Escaneo iniciado.');
    } catch (error) {
      console.error('Error al iniciar el escaneo:', error);
      this.closeModal();
    }
  }

  private async stopScan(): Promise<void> {
    try {
      console.log('Deteniendo el escaneo...');
      document.querySelector('body')?.classList.remove('barcode-scanning-active');
      await BarcodeScanner.stopScan();
      console.log('Escaneo detenido.');
    } catch (error) {
      console.error('Error al detener el escaneo:', error);
    }
  }

  private isOutsideDetectionArea(
    detectionArea: number[][],
    cornerPoints: number[][]
  ): boolean {
    console.log('Validando área de detección...');
    return (
      detectionArea[0][0] > cornerPoints[0][0] ||
      detectionArea[0][1] > cornerPoints[0][1] ||
      detectionArea[1][0] < cornerPoints[1][0] ||
      detectionArea[1][1] > cornerPoints[1][1] ||
      detectionArea[2][0] < cornerPoints[2][0] ||
      detectionArea[2][1] < cornerPoints[2][1] ||
      detectionArea[3][0] > cornerPoints[3][0] ||
      detectionArea[3][1] < cornerPoints[3][1]
    );
  }
}
