import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class CoreService {
  constructor(private http: HttpClient) { }

  public async fetch_statistics(): Promise<any> {
    return firstValueFrom(this.http.get<any>(`${environment.api}/statistics`));
  }
}
