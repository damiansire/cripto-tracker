import { Component, inject, signal } from '@angular/core';
import { EthereumData, CsvDataService } from './csv-data.service';
import { HttpClientModule, provideHttpClient } from '@angular/common/http';

@Component({
  selector: 'app-continuous-buying-selling',
  standalone: true,
  imports: [],
  providers: [CsvDataService],
  templateUrl: './continuous-buying-selling.component.html',
  styleUrl: './continuous-buying-selling.component.css',
})
export class ContinuousBuyingSellingComponent {
  private csvDataService = inject(CsvDataService);
  ethereumData = signal<EthereumData[]>([]);

  ngOnInit() {
    this.csvDataService.getEthereumData().subscribe((data) => {
      this.ethereumData.set(data);
    });
  }
}
