import { Component, computed, inject, Signal, signal } from '@angular/core';
import { EthereumData, CsvDataService } from './csv-data.service';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

type OrderStatus = 'pendingToBuy' | 'pendingToSell';

interface Order {
  sellPrice: number;
  buyPrice: number;
  status: OrderStatus;
}

interface ClosedPosition {
  buyPrice: number;
  sellPrice: number;
  profit: number;
}

interface LastData {
  timeHigh: Date;
  timeLow: Date;
  priceHigh: number;
  priceLow: number;
  priceClose: number;
  priceOpen: number;
  timeOpen: Date;
}

@Component({
  selector: 'app-continuous-buying-selling',
  standalone: true,
  imports: [CommonModule, TableModule, TagModule],
  providers: [CsvDataService],
  templateUrl: './continuous-buying-selling.component.html',
  styleUrl: './continuous-buying-selling.component.css',
})
export class ContinuousBuyingSellingComponent {
  private csvDataService = inject(CsvDataService);
  ethereumData = signal<EthereumData[]>([]);
  step = 1;
  money = 2600;
  intervalForBuy = 50;
  orders = signal<Order[]>([]);
  historicalClosedPosition = signal<ClosedPosition[]>([]);
  profit = computed(() => {
    return this.historicalClosedPosition().reduce((acc, current) => {
      return acc + current.profit;
    }, 0);
  });

  lastData = signal<LastData>({
    priceHigh: 0,
    priceLow: 0,
    priceClose: 0,
    priceOpen: 0,
    timeHigh: new Date(),
    timeLow: new Date(),
    timeOpen: new Date(),
  });
  ngOnInit() {
    this.csvDataService.getEthereumData().subscribe((data) => {
      this.ethereumData.set(data);
      this.lastData.set(this.getLastDataFromStep(this.step));
      for (let index = 1; index < this.ethereumData().length - 1; index++) {
        this.nextStep();
      }
    });
    //Elijo comprar del 1000 al 3600
    for (let index = 1; index <= 36; index++) {
      this.orders.update((x) => [
        ...x,
        {
          sellPrice: 1000 + index * this.intervalForBuy + this.intervalForBuy,
          buyPrice: 1000 + index * this.intervalForBuy,
          status: 'pendingToBuy',
        },
      ]);
    }
  }
  sortOrdersByProximity(orders: Order[], referencePrice: number) {
    return orders.slice().sort((a, b) => {
      const distanceA =
        Math.abs(a.buyPrice - referencePrice) +
        Math.abs(a.sellPrice - referencePrice);
      const distanceB =
        Math.abs(b.buyPrice - referencePrice) +
        Math.abs(b.sellPrice - referencePrice);
      return distanceA - distanceB;
    });
  }
  nextStep() {
    this.step++;
    const newData = this.getLastDataFromStep(this.step);
    const sucesionOfMultiples = this.getSucesionOfPrices(newData);
    let lastPrice = newData.priceOpen;
    for (const element of sucesionOfMultiples) {
      const orderBuy = this.orders().find((x) => x.buyPrice === element);
      if (
        orderBuy?.status === 'pendingToBuy' &&
        orderBuy?.buyPrice === element
      ) {
        this.buyCrypto(element);
      }
      const orderSell = this.orders().find((x) => x.sellPrice === element);
      if (element > lastPrice) {
        if (
          orderSell?.status === 'pendingToSell' &&
          orderSell?.sellPrice === element
        ) {
          this.sellCrypto(element);
        }
      }
    }
    this.lastData.set(newData);
    this.orders.update((orders) =>
      this.sortOrdersByProximity(orders, this.lastData().priceClose)
    );
  }
  buyCrypto(price: number) {
    this.money -= this.intervalForBuy;
    this.changeOrderStatusByBuyPrice(price, 'pendingToSell');
  }
  sellCrypto(price: number) {
    const order = this.orders().find((x) => x.sellPrice === price);
    debugger;
    if (order) {
      this.changeOrderStatusByBuyPrice(price, 'pendingToBuy');
      const profit = (this.intervalForBuy / order.buyPrice) * order.sellPrice;
      const closedOrder = {
        buyPrice: order.buyPrice,
        sellPrice: order.sellPrice,
        profit: profit - this.intervalForBuy,
      };
      this.money += profit;
      this.historicalClosedPosition.update((existingClosedPositions) => [
        ...existingClosedPositions,
        closedOrder,
      ]);
    }
  }
  changeOrderStatusByBuyPrice(price: number, newState: OrderStatus) {
    this.orders.update((orders) =>
      orders.map((order) =>
        order.buyPrice === price ? { ...order, status: newState } : order
      )
    );
  }
  changeOrderStatusBySellPrice(price: number, newState: OrderStatus) {
    this.orders.update((orders) =>
      orders.map((order) =>
        order.sellPrice === price ? { ...order, status: newState } : order
      )
    );
  }
  getLastDataFromStep(step: number) {
    return {
      priceHigh: this.ethereumData()[step].priceHigh,
      priceLow: this.ethereumData()[step].priceLow,
      priceClose: this.ethereumData()[step].priceClose,
      priceOpen: this.ethereumData()[step].priceOpen,
      timeHigh: this.ethereumData()[step].timeHigh,
      timeLow: this.ethereumData()[step].timeLow,
      timeOpen: this.ethereumData()[step].timeOpen,
    };
  }
  getMultiplesOf100Between(num1: number, num2: number) {
    const multiples = [];

    // Ordenar los números, pero guardar el orden original
    const sorted = [num1, num2].sort((a, b) => a - b);
    const reverseOrder = num1 > num2; // ¿El orden original era inverso?

    // Encontrar el primer múltiplo de this.intervalForBuy mayor o igual que el mínimo
    let currentMultiple =
      Math.ceil(sorted[0] / this.intervalForBuy) * this.intervalForBuy;

    // Generar los múltiplos hasta que sean mayores que el máximo
    while (currentMultiple <= sorted[1]) {
      multiples.push(currentMultiple);
      currentMultiple += this.intervalForBuy;
    }

    // Revertir el array si el orden original era inverso
    return reverseOrder ? multiples.reverse() : multiples;
  }
  getSucesionOfPrices(newData: LastData) {
    const [first, second, third] =
      newData.timeHigh < newData.timeLow
        ? [
            newData.priceOpen,
            newData.priceHigh,
            newData.priceLow,
            newData.priceClose,
          ]
        : [
            newData.priceOpen,
            newData.priceLow,
            newData.priceHigh,
            newData.priceClose,
          ];

    return [
      ...this.getMultiplesOf100Between(first, second),
      ...this.getMultiplesOf100Between(second, third),
      ...this.getMultiplesOf100Between(third, newData.priceClose),
    ];
  }
}
