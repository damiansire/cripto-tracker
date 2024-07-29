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
      .pipe(map((csvData) => this.parseCsv(csvData)));
  }

  private parseCsv(csvData: string): EthereumData[] {
    const rows: EthereumData[] = [];
    const lines = csvData.split('\r\n');
    const headers = lines[0].split(';');
    for (let index = 1; index < lines.length - 1; index++) {
      const line = lines[index];
      const cleanLine = line.replace('\n', '');
      const values = cleanLine.split(';');
      if (values.length != headers.length) {
        const row = {
          timeOpen: new Date(parseInt(values[0], 10)),
          timeClose: new Date(parseInt(values[1], 10)),
          timeHigh: new Date(parseInt(values[2], 10)),
          timeLow: new Date(parseInt(values[3], 10)),
          priceOpen: parseFloat(values[4].replace(',', '.')),
          priceHigh: parseFloat(values[5].replace(',', '.')),
          priceLow: parseFloat(values[6].replace(',', '.')),
          priceClose: parseFloat(values[7].replace(',', '.')),
          volume: parseFloat(values[8].replace(',', '.')),
        } as EthereumData;
        rows.push(row);
      }
    }
    return rows;
  }
}
