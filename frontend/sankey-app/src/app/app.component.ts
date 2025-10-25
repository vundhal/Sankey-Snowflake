import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './services/auth.service';
import { ApiService, SankeyData } from './services/api.service';
import { FilterPanelComponent } from './components/filter-panel.component';
import { SankeyDiagramComponent } from './components/sankey-diagram.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet,
    FilterPanelComponent,
    SankeyDiagramComponent
  ],
  template: `
    <div class="app-container">
      <header>
        <h1>Snowflake Sankey Visualization</h1>
        <div class="auth-section">
          <span *ngIf="authenticated" class="user-info">
            {{ userEmail }}
          </span>
          <button *ngIf="!authenticated" (click)="login()" class="auth-btn">
            Login with Azure AD
          </button>
          <button *ngIf="authenticated" (click)="logout()" class="auth-btn logout">
            Logout
          </button>
        </div>
      </header>

      <main *ngIf="authenticated">
        <div class="content">
          <aside class="sidebar">
            <app-filter-panel (filtersChanged)="onFiltersChanged($event)"></app-filter-panel>
          </aside>
          
          <div class="main-content">
            <div *ngIf="loading" class="loading">Loading data...</div>
            <app-sankey-diagram 
              [data]="sankeyData"
              [onNodeClick]="handleNodeClick.bind(this)">
            </app-sankey-diagram>
          </div>
        </div>
      </main>

      <main *ngIf="!authenticated" class="login-prompt">
        <div class="welcome">
          <h2>Welcome to Snowflake Sankey Visualization</h2>
          <p>Please login with your Azure AD account to access the application.</p>
          <button (click)="login()" class="login-btn-large">
            Login with Azure AD
          </button>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: #f0f2f5;
    }

    header {
      background: #1976d2;
      color: white;
      padding: 15px 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    h1 {
      margin: 0;
      font-size: 24px;
    }

    .auth-section {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .user-info {
      font-size: 14px;
    }

    .auth-btn {
      padding: 8px 16px;
      background: white;
      color: #1976d2;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
    }

    .auth-btn:hover {
      background: #f0f0f0;
    }

    .auth-btn.logout {
      background: #d32f2f;
      color: white;
    }

    .auth-btn.logout:hover {
      background: #b71c1c;
    }

    .content {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 20px;
      padding: 20px;
      max-width: 1600px;
      margin: 0 auto;
    }

    .sidebar {
      background: white;
      border-radius: 8px;
      padding: 0;
      height: fit-content;
    }

    .main-content {
      position: relative;
    }

    .loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 18px;
      color: #666;
    }

    .login-prompt {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 70px);
    }

    .welcome {
      text-align: center;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      max-width: 500px;
    }

    .welcome h2 {
      color: #333;
      margin-bottom: 15px;
    }

    .welcome p {
      color: #666;
      margin-bottom: 25px;
      font-size: 16px;
    }

    .login-btn-large {
      padding: 12px 24px;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      font-weight: bold;
    }

    .login-btn-large:hover {
      background: #1565c0;
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'Snowflake Sankey Visualization';
  authenticated = false;
  userEmail = '';
  sankeyData: SankeyData[] = [];
  loading = false;
  currentFilters: any = {};

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.authService.initialize();
    
    this.authService.authenticated$.subscribe(authenticated => {
      this.authenticated = authenticated;
      if (authenticated) {
        const account = this.authService.getCurrentAccount();
        this.userEmail = account?.username || 'User';
        this.sendAuthTokenToBackend();
        this.loadData();
      }
    });
  }

  async login(): Promise<void> {
    try {
      await this.authService.login();
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please check your Azure AD configuration.');
    }
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      await this.apiService.logout().toPromise();
      this.sankeyData = [];
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  async sendAuthTokenToBackend(): Promise<void> {
    try {
      await this.apiService.sendAuthToken();
    } catch (error) {
      console.error('Failed to send auth token to backend:', error);
    }
  }

  loadData(): void {
    this.loading = true;
    this.apiService.getSankeyData(this.currentFilters).subscribe({
      next: (data) => {
        this.sankeyData = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading Sankey data:', error);
        this.loading = false;
        if (error.status === 401) {
          alert('Session expired. Please login again.');
          this.logout();
        }
      }
    });
  }

  onFiltersChanged(filters: any): void {
    this.currentFilters = filters;
    this.loadData();
  }

  handleNodeClick(nodeName: string): void {
    console.log('Node clicked:', nodeName);
    
    const userConfirm = confirm(`Filter by: ${nodeName}?\n\nThis will update the visualization to show only data related to this node.`);
    
    if (userConfirm) {
      // TODO: Customize this logic based on your data structure
      // This example filters by SOURCE. You may need to:
      // 1. Determine if the node is a source or target
      // 2. Apply the appropriate filter field(s)
      // 3. Preserve existing filters instead of replacing them
      // Example for preserving filters:
      // this.currentFilters = {
      //   ...this.currentFilters,
      //   SOURCE: [nodeName]  // or TARGET: [nodeName] based on node type
      // };
      
      this.currentFilters = {
        SOURCE: [nodeName]
      };
      
      this.loadData();
    }
  }
}
