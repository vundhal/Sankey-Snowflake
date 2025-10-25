import { Injectable } from '@angular/core';
import { 
  PublicClientApplication, 
  InteractionRequiredAuthError,
  AccountInfo,
  AuthenticationResult
} from '@azure/msal-browser';
import { msalConfig, loginRequest } from '../auth.config';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private msalInstance: PublicClientApplication;
  private authenticatedSubject = new BehaviorSubject<boolean>(false);
  public authenticated$ = this.authenticatedSubject.asObservable();
  private currentAccount: AccountInfo | null = null;

  constructor() {
    this.msalInstance = new PublicClientApplication(msalConfig);
  }

  async initialize(): Promise<void> {
    await this.msalInstance.initialize();
    await this.msalInstance.handleRedirectPromise();
    
    const accounts = this.msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      this.currentAccount = accounts[0];
      this.msalInstance.setActiveAccount(this.currentAccount);
      this.authenticatedSubject.next(true);
    }
  }

  async login(): Promise<void> {
    try {
      const response = await this.msalInstance.loginPopup(loginRequest);
      this.currentAccount = response.account;
      this.msalInstance.setActiveAccount(this.currentAccount);
      this.authenticatedSubject.next(true);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    await this.msalInstance.logoutPopup();
    this.currentAccount = null;
    this.authenticatedSubject.next(false);
  }

  async getAccessToken(): Promise<string> {
    if (!this.currentAccount) {
      throw new Error('No active account');
    }

    const request = {
      scopes: loginRequest.scopes,
      account: this.currentAccount
    };

    try {
      const response = await this.msalInstance.acquireTokenSilent(request);
      return response.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        const response = await this.msalInstance.acquireTokenPopup(request);
        return response.accessToken;
      }
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return this.authenticatedSubject.value;
  }

  getCurrentAccount(): AccountInfo | null {
    return this.currentAccount;
  }
}
