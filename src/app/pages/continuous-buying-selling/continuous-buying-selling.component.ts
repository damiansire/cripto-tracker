import { Component, inject, signal } from '@angular/core';
import { EthereumData, CsvDataService } from './csv-data.service';

interface Order {
  sellPrice: number;
  buildPrice: number;
  isPending: boolean;
}

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
  step = 0;
  money = 2600;
  orders: Order[] = [];
  ngOnInit() {
    this.csvDataService.getEthereumData().subscribe((data) => {
      this.ethereumData.set(data);
    });
    //Elijo comprar del 1000 al 3600
    for (let index = 1; index <= 36; index++) {
      this.orders.push({
        sellPrice: 1000 + index * 100 + 100,
        buildPrice: 1000 + index * 100,
        isPending: true,
      });
    }
  }
  nextStep() {
    this.step++;
  }
}
