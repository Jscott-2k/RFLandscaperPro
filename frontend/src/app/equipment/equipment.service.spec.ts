import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { EquipmentApiService } from '../api/equipment-api.service';
import { EquipmentService } from './equipment.service';

describe('EquipmentService', () => {
  let service: EquipmentService;
  let apiSpy: jasmine.SpyObj<EquipmentApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj<EquipmentApiService>('EquipmentApiService', ['getEquipment']);
    apiSpy.getEquipment.and.returnValue(of({ items: [], total: 0 }));

    TestBed.configureTestingModule({
      providers: [EquipmentService, { provide: EquipmentApiService, useValue: apiSpy }],
    });

    service = TestBed.inject(EquipmentService);
  });

  it('should call EquipmentApiService.getEquipment', () => {
    service.getEquipmentList().subscribe();
     
    expect(apiSpy.getEquipment).toHaveBeenCalled();
  });
});
