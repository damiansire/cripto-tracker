import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface EthereumData {
  timeOpen: Date;
  timeClose: Date;
  timeHigh: Date;
  timeLow: Date;
  priceOpen: number;
  priceHigh: number;
  priceLow: number;
  priceClose: number;
  volume: number;
}

@Injectable({
  providedIn: 'root',
})
export class CsvDataService {
  private http = inject(HttpClient);
  getEthereumData(): Observable<EthereumData[]> {
    return this.http
      .get('assets/criptos-history/ethereum.csv', { responseType: 'text' })
      .pipe(tap(console.log))
      .pipe(map((csvData) => this.parseCsv(csvData)));
  }

  private parseCsv(csvData: string): EthereumData[] {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');

    return lines.slice(1).map((line) => {
      const values = line.split(',');
      return headers.reduce((obj: any, header, index) => {
        switch (header) {
          case 'timeOpen':
          case 'timeClose':
          case 'timeHigh':
          case 'timeLow':
            obj[header] = new Date(parseInt(values[index], 10));
            break;
          case 'priceOpen':
          case 'priceHigh':
          case 'priceLow':
          case 'priceClose':
          case 'volume':
            obj[header] = parseFloat(values[index].replace(',', '.'));
            break;
          default:
            obj[header] = values[index];
        }
        return obj;
      }, {}) as EthereumData;
    });
  }
}
