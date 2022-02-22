import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

import { environment } from '@environments/environment';

import { User } from '@client/helpers/models/user';

export function AuthenticationServiceFactory(authenticationService: AuthenticationService): () => Promise<User> {
  return () => authenticationService.init();
}

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  public user: BehaviorSubject<User | null>;

  constructor(private http: HttpClient) {
    this.user = new BehaviorSubject<User | null>(null);
  }

  public init(): Promise<User> {
    return this.session();
  }

  public logged(): User {
    return this.user?.value;
  }

  public async session(): Promise<User> {
    let user: User = this.logged();
    if (user) return user;
    else {
      try {
        user = await this.http.get<User>(`${environment.api}/session`).toPromise();
        this.set(user);
        return user;
      } catch (error) {
        this.set(null);
        return null;
      }
    }
  }

  public async login(username: string, password: string): Promise<User> {
    const headers: HttpHeaders = new HttpHeaders({ 'Authorization': `Basic ${btoa(username + ':' + password)}` });
    const user: User = await this.http.post<User>(`${environment.api}/authenticate`, {}, { 'headers': headers }).toPromise();

    this.set(user);
    return this.logged();
  }

  public async logout(): Promise<void> {
    this.set(null);
    return firstValueFrom(this.http.post<void>(`${environment.api}/logout`, {}));
  }

  public async initialize(user: User & Record<'password', string>): Promise<boolean> {
    return firstValueFrom(this.http.post<boolean>(`${environment.api}/initialize`, user));
  }

  private set(user: User | null): void {
    this.user.next(user);
  }
}
