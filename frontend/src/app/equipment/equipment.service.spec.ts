import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { EquipmentService } from './equipment.service';
import { EquipmentApiService } from '../api/equipment-api.service';

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
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(apiSpy.getEquipment).toHaveBeenCalled();
  });
});
