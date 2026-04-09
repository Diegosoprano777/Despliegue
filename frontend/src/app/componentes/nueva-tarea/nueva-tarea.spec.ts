import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NuevaTareaComponent } from './nueva-tarea';

describe('NuevaTarea', () => {
  let component: NuevaTareaComponent;
  let fixture: ComponentFixture<NuevaTareaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuevaTareaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NuevaTareaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
