import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { CookieService } from './cookie.service';
import { TenantSummaryResponse } from './domain/tenant-summary-response';
import { environment } from '../../environments/environment';
import { catchError, Observable } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { TenantCreateRequest } from './domain/tenant-create-request';
import { TenantCreateResponse } from './domain/tenant-create-response';

@Injectable({
  providedIn: 'root',
})
export class TenantService {
  constructor(
    private http: HttpClient,
    private cookieService: CookieService
  ) {}

  public getTenantSummaries(): Observable<TenantSummaryResponse[]> {
    const token = this.cookieService.getCookie('iridium-token');
    const headers = new HttpHeaders({
      Accept: 'application/vnd.iridium.id.tenant-summary-list.1+json',
      Authorization: 'Bearer ' + token,
    });

    const options = { headers: headers };
    return this.http.get<TenantSummaryResponse[]>(
      environment.iridium.domain + 'tenants',
      options
    );
  }

  public create(tenantName: string, tenantEnvironment: string) {
    const request = new TenantCreateRequest();
    request.environment = tenantEnvironment;
    request.subdomain = tenantName;
    const token = this.cookieService.getCookie('iridium-token');
    const headers = new HttpHeaders({
      Accept: 'application/vnd.iridium.id.authn.tenant-create-response1+json',
      'Content-Type':
        'application/vnd.iridium.id.authn.tenant-create-request.1+json',
      Authorization: 'Bearer ' + token,
    });
    const options = { headers: headers };
    return this.http
      .post<TenantCreateResponse>(
        environment.iridium.domain + 'tenants',
        request,
        options
      )
      .pipe();
  }
}
