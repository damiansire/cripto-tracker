import { Component, inject, Signal, signal } from '@angular/core';
import { EthereumData, CsvDataService } from './csv-data.service';
import { CommonModule } from '@angular/common';

interface Order {
  sellPrice: number;
  buyPrice: number;
  isPending: boolean;
}

interface Operation {
  action: 'buy' | 'sell';
  price: number;
}

@Component({
  selector: 'app-continuous-buying-selling',
  standalone: true,
  imports: [CommonModule],
  providers: [CsvDataService],
  templateUrl: './continuous-buying-selling.component.html',
  styleUrl: './continuous-buying-selling.component.css',
})
export class ContinuousBuyingSellingComponent {
  private csvDataService = inject(CsvDataService);
  ethereumData = signal<EthereumData[]>([]);
  step = 132;
  money = 2600;
  orders = signal<Order[]>([]);
  historicalOperations = signal<Operation[]>([]);
  portfolio = [];
  lastData = { priceHigh: 0, priceLow: 0 };
  ngOnInit() {
    this.csvDataService.getEthereumData().subscribe((data) => {
      this.ethereumData.set(data);
      this.lastData = {
        priceHigh: this.ethereumData()[this.step].priceHigh,
        priceLow: this.ethereumData()[this.step].priceLow,
      };
    });
    //Elijo comprar del 1000 al 3600
    for (let index = 1; index <= 36; index++) {
      this.orders.update((x) => [
        ...x,
        {
          sellPrice: 1000 + index * 100 + 100,
          buyPrice: 1000 + index * 100,
          isPending: true,
        },
      ]);
    }
  }
  nextStep() {
    this.step++;
    const newData = {
      priceHigh: this.ethereumData()[this.step].priceHigh,
      priceLow: this.ethereumData()[this.step].priceLow,
    };

    let currentIndex = Math.trunc(this.lastData.priceLow / 100);
    let objetiveIndex = Math.trunc(newData.priceLow / 100);

    //Compro si baja
    while (currentIndex > objetiveIndex) {
      const buyPrice = currentIndex * 100;
      const order = this.orders().find((x) => x.buyPrice === buyPrice);
      if (order?.isPending) {
        this.buyCrypto(buyPrice);
      }
      currentIndex--;
    }

    currentIndex = Math.trunc(this.lastData.priceLow / 100);
    objetiveIndex = Math.trunc(newData.priceLow / 100);

    //Math.trunc(this.lastData.priceLow / 100)
    //eg: 2267 -> 22
    //Math.trunc(newData.priceLow / 100) * 100 ;
    //eg: 2449 -> 24
    //Si el precio bajo mas de lo que estaba
    while (currentIndex < objetiveIndex) {
      const buyPrice = (currentIndex + 1) * 100;
      const order = this.orders().find((x) => x.buyPrice === buyPrice);
      if (order?.isPending) {
        this.buyCrypto(buyPrice);
      }
      currentIndex++;
    }

    /*
    const menorCotaParaActual = Math.trunc(this.lastData.priceLow / 100) * 100;
    const currentLowerPrice = Math.trunc(newData.priceLow / 100) * 100;
    if (currentLowerPrice < whenBuy) {
      //Evaluo si is pending de orden esta en true
      const order = this.orders().find((x) => x.buyPrice === whenBuy);
      if (order?.isPending) {
        this.buyCrypto(whenBuy);
      }
    }
      */
  }
  buyCrypto(price: number) {
    this.money -= 100;
    const operation: Operation = {
      action: 'buy',
      price: price,
    };
    this.historicalOperations.update((x) => [...x, operation]);
    this.orders.update((orders) =>
      orders.map((order) =>
        order.buyPrice === price ? { ...order, isPending: false } : order
      )
    );
  }
}
