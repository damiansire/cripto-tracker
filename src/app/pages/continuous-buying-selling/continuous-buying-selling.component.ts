import { Component, inject, Signal, signal } from '@angular/core';
import { EthereumData, CsvDataService } from './csv-data.service';
import { CommonModule } from '@angular/common';

interface Order {
  sellPrice: number;
  buyPrice: number;
  isPending: boolean;
}

interface ClosedPosition {
  buyPrice: number;
  sellPrice: number;
  profit: number;
}

interface SellOrder {
  price: number;
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
  pendingSellOrders = signal<SellOrder[]>([]);
  stock = signal<Operation[]>([]);
  historicalClosedPosition = signal<ClosedPosition[]>([]);

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

    //Compro si sube, pero tambien vendo si sube
    currentIndex = Math.trunc(this.lastData.priceLow / 100);
    objetiveIndex = Math.trunc(newData.priceLow / 100);

    while (currentIndex < objetiveIndex) {
      const buyPrice = (currentIndex + 1) * 100;
      //Verifico si se puede comprar algo
      const order = this.orders().find((x) => x.buyPrice === buyPrice);
      if (order?.isPending) {
        this.buyCrypto(buyPrice);
      }
      //Verifico si se puede vender algo
      const pendingSellOrders = this.pendingSellOrders().find(
        (x) => x.price === buyPrice
      );
      if (pendingSellOrders) {
        this.sellCrypto(buyPrice);
      }
      currentIndex++;
    }

    //Math.trunc(this.lastData.priceLow / 100)
    //eg: 2267 -> 22
    //Math.trunc(newData.priceLow / 100) * 100 ;
    //eg: 2449 -> 24
    //Si el precio bajo mas de lo que estaba
  }
  buyCrypto(price: number) {
    this.money -= 100;
    const operation: Operation = {
      action: 'buy',
      price: price,
    };
    this.stock.update((x) => [...x, operation]);
    this.changeOrderStatus(price, false);
    const sellOrder: SellOrder = {
      price: price + 100,
    };
    this.pendingSellOrders.update((x) => [...x, sellOrder]);
  }
  sellCrypto(price: number) {
    this.pendingSellOrders.update((pendingSellOrders) =>
      pendingSellOrders.filter((order) => order.price !== price)
    );
    this.stock.update((stock) =>
      stock.filter((order) => order.price !== price)
    );
    this.changeOrderStatus(price - 100, true);
    //Calculo el revenue y lo guardo
    const profit = (100 / (price - 100)) * price - 100;
    const newClosedPosition: ClosedPosition = {
      buyPrice: price - 100,
      sellPrice: price,
      profit: profit,
    };
    this.historicalClosedPosition.update((x) => [...x, newClosedPosition]);
  }
  changeOrderStatus(price: number, newState: boolean) {
    this.orders.update((orders) =>
      orders.map((order) =>
        order.buyPrice === price ? { ...order, isPending: newState } : order
      )
    );
  }
}
