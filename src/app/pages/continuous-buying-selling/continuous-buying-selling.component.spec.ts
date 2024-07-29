import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContinuousBuyingSellingComponent } from './continuous-buying-selling.component';

describe('ContinuousBuyingSellingComponent', () => {
  let component: ContinuousBuyingSellingComponent;
  let fixture: ComponentFixture<ContinuousBuyingSellingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContinuousBuyingSellingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContinuousBuyingSellingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
