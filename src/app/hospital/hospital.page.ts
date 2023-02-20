import { Component, OnInit, ViewChild } from '@angular/core';
import {ElementRef} from '@angular/core'
import { NavController } from '@ionic/angular';
declare var google: any;

@Component({
  selector: 'app-map',
  templateUrl: './hospital.page.html',
  styleUrls: ['./hospital.page.scss'],
})
export class HospitalPage {
  map: any;
  @ViewChild('map', {read: ElementRef, static: false}) mapRef!: ElementRef;
  infoWindows: any = [];
  markers: any = [
    {
        title: "Bệnh viện E",
        latitude: "21.050754821994172",
        longitude: "105.78928901918466"
    },
    {
        title: "Bệnh viện bộ công an",
        latitude: "21.033981744189294",
        longitude: "105.77828237544088"
    },
  ];

  constructor(public navController:NavController) { }

  ionViewDidEnter() {
    this.showMap();
  }

  addMarkersToMap(markers) {
    for (let marker of markers) {
      let position = new google.maps.LatLng(marker.latitude, marker.longitude);
      let mapMarker = new google.maps.Marker({
        position: position,
        title: marker.title,
        latitude: marker.latitude,
        longitude: marker.longitude
      });

      mapMarker.setMap(this.map);
      this.addInfoWindowToMarker(mapMarker);
    }
  }

  addInfoWindowToMarker(marker) {
    let infoWindowContent = '<div id="content">' +
                              '<h2 id="firstHeading" class"firstHeading">' + marker.title + '</h2>' +
                              '<p>Latitude: ' + marker.latitude + '</p>' +
                              '<p>Longitude: ' + marker.longitude + '</p>' +
                              '<ion-button id="navigate">Navigate</ion-button>' +
                            '</div>';

    let infoWindow = new google.maps.InfoWindow({
      content: infoWindowContent
    });

    marker.addListener('click', () => {
      this.closeAllInfoWindows();
      infoWindow.open(this.map, marker);

      google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
        document.getElementById('navigate')?.addEventListener('click', () => {
          console.log('naviagte button clicked!');
          window.open('https://www.google.com/maps/dir/?api=1&destination=' + marker.latitude + ',' + marker.longitude);
        })
      })
    });
    this.infoWindows.push(infoWindow);
  }

  closeAllInfoWindows() {
    for(let window of this.infoWindows) {
      window.close();
    }
  }

  showMap() {
    const location = new google.maps.LatLng(21.033981744189294, 105.77828237544088);
    const options = {
      center: location,
      zoom: 14,
      disableDefaultUI: true
    }
    this.map = new google.maps.Map(this.mapRef.nativeElement, options);
    this.addMarkersToMap(this.markers);
  }


  onBack() {
    this.navController.back()
  }


}
