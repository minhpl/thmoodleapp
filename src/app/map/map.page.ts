import { Component, OnInit, ViewChild } from '@angular/core';
import {ElementRef} from '@angular/core';
import {Platform} from '@ionic/angular';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { NavController } from '@ionic/angular';

declare var google: any;

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
})
export class MapPage implements OnInit{
  // map: any;
  // @ViewChild('map', {read: ElementRef, static: false}) mapRef!: ElementRef;
  // infoWindows: any = [];
  // markers: any = [
  //   {
  //       title: "Đại học Thương Mại",
  //       latitude: "21.037548219910676",
  //       longitude: "105.77432873496119"
  //   },
  //   {
  //       title: "Nghĩa trang Mai Dịch",
  //       latitude: "21.04049297522161",
  //       longitude: "105.76997801128672"
  //   },
  // ];

  constructor(private iab: InAppBrowser, private platform: Platform,public navController:NavController) {
    // this.getDirection();
  }
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

  // public lat = 24.799448;
  // public lng = 120.979021;

  // public origin: any;
  // public destination: any;

  // ngOnInit() {
  //   this.getDirection();
  // }

  // getDirection() {
  //   this.origin = { lat: 24.799448, lng: 120.979021 };
  //   this.destination = { lat: 24.799524, lng: 120.975017 };

  // }

  // ionViewDidEnter() {
  //   this.showMap();
  // }

  // addMarkersToMap(markers) {
  //   for (let marker of markers) {
  //     let position = new google.maps.LatLng(marker.latitude, marker.longitude);
  //     let mapMarker = new google.maps.Marker({
  //       position: position,
  //       title: marker.title,
  //       latitude: marker.latitude,
  //       longitude: marker.longitude
  //     });

  //     mapMarker.setMap(this.map);
  //     this.addInfoWindowToMarker(mapMarker);
  //   }
  // }

  // addInfoWindowToMarker(marker) {
  //   let infoWindowContent = '<div id="content">' +
  //                             '<h2 id="firstHeading" class"firstHeading">' + marker.title + '</h2>' +
  //                             '<p>Latitude: ' + marker.latitude + '</p>' +
  //                             '<p>Longitude: ' + marker.longitude + '</p>' +
  //                             '<ion-button id="navigate">Navigate</ion-button>' +
  //                           '</div>';

  //   let infoWindow = new google.maps.InfoWindow({
  //     content: infoWindowContent
  //   });

  //   marker.addListener('click', () => {
  //     this.closeAllInfoWindows();
  //     infoWindow.open(this.map, marker);

  //     google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
  //       document.getElementById('navigate')?.addEventListener('click', () => {

  //         this.iab.create(`https://www.google.com/maps/dir/?api=1&destination=` + marker.latitude + `,` + marker.longitude, `_system`, `location=yes`);


  //       })
  //     })
  //   });
  //   this.infoWindows.push(infoWindow);
  // }

  // closeAllInfoWindows() {
  //   for(let window of this.infoWindows) {
  //     window.close();
  //   }
  // }

  // showMap() {
  //   const location = new google.maps.LatLng(21.042542, 105.773616);
  //   const options = {
  //     center: location,
  //     zoom: 15,
  //     disableDefaultUI: true
  //   }
  //   this.map = new google.maps.Map(this.mapRef.nativeElement, options);
  //   this.addMarkersToMap(this.markers);
  // }

  // onBack() {
  //   this.navController.back()
  // }

}
