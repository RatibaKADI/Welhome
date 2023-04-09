import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { Subscription } from 'rxjs';
import { IProperty } from 'src/app/core/property/property.model';
import { PropertyService } from 'src/app/core/property/property.service';
import { Location } from '@angular/common';
import { AuthService } from '../core/auth/auth.service'
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { ReservationService } from '../core/reservation/reservation.service';
import { IReservation } from '../core/reservation/reservation.model';
import { ContextService } from '../core/context/context.service';
@Component({
  selector: 'app-properties',
  templateUrl: './properties.component.html',
  styleUrls: ['./properties.component.scss'],
  providers:[ { provide: MAT_DATE_LOCALE, useValue: 'fr' } ]
})
export class PropertiesComponent implements OnInit, OnDestroy {
  propertyData: IProperty;

  user_email: string;
  getPropertySub$: Subscription;
  paramsSub$: Subscription;
  currentImageIndex: number = 0;
  images: string[] = [];

  reservationGroup: FormGroup;


  constructor(
    private propertyService: PropertyService,
    private route: ActivatedRoute,
    private reservationService: ReservationService,
    private locationService: Location,
    private authService: AuthService,
    private adapter: DateAdapter<any>,
    private contextService: ContextService
    
  ) {}

  ngOnInit(): void {
    this.adapter.setLocale('fr');
    this.reservationGroup = new FormGroup({
      start_date: new FormControl('', [Validators.required, this.validateDate()]),
      end_date: new FormControl('', [Validators.required, this.validateDate()])
    });
    this.paramsSub$ = this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (id === null) {
        this.locationService.back();
        return;
      }
      this.getPropertySub$ = this.propertyService.getProperties().getPropertyObservable().subscribe(properties => {
        const property = properties.find(p => p.id === id);
        if (property === undefined) {
          this.locationService.back();
          return;
        }
        this.propertyData = property;
        this.images = [];
        if (this.propertyData.image_url !== undefined) {
          this.images.push(this.propertyData.image_url);
        }
        if (this.propertyData.image_url2 !== undefined) {
          this.images.push(this.propertyData.image_url2);
        }
        if (this.propertyData.image_url3 !== undefined) {
          this.images.push(this.propertyData.image_url3);
        }   
      });
    });
    this.user_email = this.authService.profile?.email || '';
  }

  validateDate(): ValidatorFn {
    return (control: AbstractControl) => {
      const date = control.value;
      if (date !== null && date !== undefined && date < Date.now()) {
        return { dateMinimum: true };
      }
      return null;
    };
  }

  get isOwner(): boolean {
    return this.user_email === this.propertyData.owner_email;
  }

  get isRenterContext(): boolean {
    return this.contextService.isRenter;
  }

  ngOnDestroy(): void {
    this.getPropertySub$.unsubscribe();
    this.paramsSub$.unsubscribe();
  }

  nextImage() {
    this.currentImageIndex++;
    if (this.currentImageIndex >= this.images.length) {
      this.currentImageIndex = 0;
    }
  }

  get userIsLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }

  promptLogin(): void {
    this.authService.login();
  }
  
  reserveProperty(): void {
    if (this.reservationGroup.valid) {
      const reservation: IReservation = {
        ...this.reservationGroup.value,
        renter_email: this.user_email,
        property_id: this.propertyData.id,
        confirmed_owner: false,
        confirmed_renter: false
      }
      this.reservationService.addReservation(reservation).subscribe(() => {
        this.reservationGroup.reset();
      });
    }
  }
  
  /*
  $(document).ready(function() {
    var currentPhoto = 1;
    var numPhotos = $('.small-photo').length;

    function showPhoto(photoNum) {
      $('.main-photo').attr('src', $('.small-photo:eq(' + (photoNum-1) + ')').attr('src'));
      $('.small-photo').removeClass('active');
      $('.small-photo:eq(' + (photoNum-1) + ')').addClass('active');
    }

    $('.small-photo').click(function() {
      currentPhoto = $(this).index() + 1;
      showPhoto(currentPhoto);
    });

    $('#next-btn').click(function() {
      currentPhoto++;
      if (currentPhoto > numPhotos) {
        currentPhoto = 1;
      }
      showPhoto(currentPhoto);
    });

    showPhoto(currentPhoto);
  });
  */
}
