import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface SankeyData {
  SOURCE: string;
  TARGET: string;
  VALUE: number;
  SOURCE_ATTRIBUTE?: string;
  TARGET_ATTRIBUTE?: string;
  VALUE_SPLIT_CATEGORY?: string;
}

export interface FilterCategory {
  CATEGORY_FIELD_1: string;
  CATEGORY_FIELD_2: string;
  CATEGORY_FIELD_3: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  async sendAuthToken(): Promise<void> {
    const token = await this.authService.getAccessToken();
    await this.http.post(`${this.baseUrl}/auth/token`, { token }).toPromise();
  }

  getAuthStatus(): Observable<any> {
    return this.http.get(`${this.baseUrl}/auth/status`);
  }

  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/logout`, {});
  }

  getFilterCategories(): Observable<FilterCategory[]> {
    return this.http.get<FilterCategory[]>(`${this.baseUrl}/filters/categories`);
  }

  getSankeyData(filters: any): Observable<SankeyData[]> {
    return this.http.post<SankeyData[]>(`${this.baseUrl}/data/sankey`, { filters });
  }
}
