import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HomePageRoutingModule } from './home-routing.module';

import { HomePage } from './home.page';
import { SharedModule } from 'src/app/shared/shared.module';

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BarcodeScanningModalComponent } from './barcode-scanning-modal.component';



@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    SharedModule
  ],
  declarations: [HomePage, BarcodeScanningModalComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]

})
export class HomePageModule {}
