import { Injectable, inject } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { User } from '../models/user.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { getFirestore, setDoc, doc, getDoc, addDoc, collection, collectionData, query, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { UtilsService } from './utils.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { getStorage, uploadString, ref, getDownloadURL, deleteObject } from "firebase/storage";


@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  auth = inject(AngularFireAuth);
  firestore = inject(AngularFirestore);
  storage = inject(AngularFireStorage);
  utilsSvc = inject(UtilsService);

  // ======================= Autenticación =======================

  getAuth() {
    return getAuth();
  }


  // ================== Acceder ==================

  signIn(user: User) {

    return signInWithEmailAndPassword(getAuth(), user.email, user.password);

  }



  // ===================== crear usuario ==============

  signUp(user: User) {

    return createUserWithEmailAndPassword(getAuth(), user.email, user.password);

  }


  // ============ Actualizar usuario ============

  updateCurrentUser(displayName: string) {

    return updateProfile(getAuth().currentUser, { displayName })

  }



  // ============ Enviar email para restablecer contraseña  ============


  sendRecoveryEmail(email: string) {

    return sendPasswordResetEmail(getAuth(), email);

  }

  // ======== Cerrar Sesión ============


  async signOut() {
    try {
      await getAuth().signOut(); // Espera a que se complete la salida
      localStorage.removeItem('user'); // Elimina el usuario del almacenamiento local
      this.utilsSvc.routerLink('/auth'); // Redirige al usuario
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Puedes mostrar un mensaje de error si lo deseas
    }
  }
  






  // ============ Base de Datos ============



  // === Obtener documentos de una coleccion ====

  // getCollectionData(path: string, collectionQuery?: any) {
  //   const ref = collection(getFirestore(), path);

  //   // Si `collectionQuery` está definido, usa la consulta. De lo contrario, solo usa `ref`.
  //   const collectionRef = collectionQuery ? query(ref, collectionQuery) : ref;

  //   return collectionData(collectionRef, { idField: 'id' });
  // }



  // === Obtener documentos de una colección ===
  getCollectionData(path: string, collectionQuery?: any) {
    const ref = collection(getFirestore(), path);
    const collectionRef = collectionQuery ? query(ref, collectionQuery) : ref;
    return collectionData(collectionRef, { idField: 'id' });
  }


  // === setear un documento ==== 

  setDocument(path: string, data: any) {

    return setDoc(doc(getFirestore(), path), data);

  }


  // === Actualizar un documento ==== 

  updateDocument(path: string, data: any) {

    return updateDoc(doc(getFirestore(), path), data);

  }


  // === Eliminar  un documento ==== 

  deleteDocument(path: string) {

    return deleteDoc(doc(getFirestore(), path));

  }




  // === Obtener un documento ==== 

  // async getDocument(path: string) {

  //   return (await getDoc(doc(getFirestore(), path))).data();

  // }


  // === Obtener un documento ===
  async getDocument(path: string) {
    const docRef = doc(getFirestore(), path);
    const docSnapshot = await getDoc(docRef);
    return docSnapshot.exists() ? docSnapshot.data() : null;
  }




  // === agregar un documento ==== 

  addDocument(path: string, data: any) {
    return this.firestore.collection(path).add(data);
  }
  
  

  // ============ alamcenamiento ============

  // ====== Subir imagen =======

  async uploadImage(path: string, data_url: string) {
    return uploadString(ref(getStorage(), path), data_url, 'data_url').then(() => {
      return getDownloadURL(ref(getStorage(), path))
    })

  }

  // ====== Obtener ruta de la imagen con su url =======

  async getFilePath(url: string) {

    return ref(getStorage(), url).fullPath
  }



  // ====== Eliminar Archivo =======

  deleteFile(path: string) {
    return deleteObject(ref(getStorage(), path));

  }




//===== Obtener eventos registrados ======

async registerAttendance(productId: string, userId: string) {
  const path = `products/${productId}/attendees/${userId}`;
  const docRef = doc(getFirestore(), path);

  try {
    // Verificar si el usuario ya está registrado
    const docSnapshot = await getDoc(docRef);
    if (docSnapshot.exists()) {
      return { success: false, message: 'Ya estás registrado en este evento' };
    }

    // Registrar asistencia si el usuario no está registrado
    await setDoc(docRef, { userId });
    return { success: true, message: 'Asistencia registrada exitosamente' };
  } catch (error) {
    console.error("Error al registrar asistencia:", error);
    throw error;
  }
}






}
