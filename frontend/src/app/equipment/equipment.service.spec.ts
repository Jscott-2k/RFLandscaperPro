import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { EquipmentService } from './equipment.service';
import { ApiService } from '../api.service';

describe('EquipmentService', () => {
  let service: EquipmentService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', ['getEquipment']);
    apiSpy.getEquipment.and.returnValue(of({ items: [], total: 0 }));

    TestBed.configureTestingModule({
      providers: [EquipmentService, { provide: ApiService, useValue: apiSpy }],
    });

    service = TestBed.inject(EquipmentService);
  });

  it('should call ApiService.getEquipment', () => {
    service.getEquipmentList().subscribe();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(apiSpy.getEquipment).toHaveBeenCalled();
  });
});
