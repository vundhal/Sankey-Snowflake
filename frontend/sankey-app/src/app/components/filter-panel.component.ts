import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, FilterCategory } from '../services/api.service';

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filter-panel">
      <h3>Filters</h3>
      
      <div class="filter-group" *ngIf="categories.length > 0">
        <label>Category Field 1:</label>
        <select [(ngModel)]="selectedFilters.CATEGORY_FIELD_1" (change)="onFilterChange()">
          <option value="">All</option>
          <option *ngFor="let cat of uniqueCategories1" [value]="cat">{{ cat }}</option>
        </select>
      </div>

      <div class="filter-group" *ngIf="categories.length > 0">
        <label>Category Field 2:</label>
        <select [(ngModel)]="selectedFilters.CATEGORY_FIELD_2" (change)="onFilterChange()">
          <option value="">All</option>
          <option *ngFor="let cat of uniqueCategories2" [value]="cat">{{ cat }}</option>
        </select>
      </div>

      <div class="filter-group" *ngIf="categories.length > 0">
        <label>Category Field 3:</label>
        <select [(ngModel)]="selectedFilters.CATEGORY_FIELD_3" (change)="onFilterChange()">
          <option value="">All</option>
          <option *ngFor="let cat of uniqueCategories3" [value]="cat">{{ cat }}</option>
        </select>
      </div>

      <button (click)="resetFilters()" class="reset-btn">Reset Filters</button>
    </div>
  `,
  styles: [`
    .filter-panel {
      padding: 20px;
      background: #f5f5f5;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    h3 {
      margin-top: 0;
      color: #333;
    }

    .filter-group {
      margin-bottom: 15px;
    }

    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
      color: #555;
    }

    select {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .reset-btn {
      width: 100%;
      padding: 10px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin-top: 10px;
    }

    .reset-btn:hover {
      background: #0056b3;
    }
  `]
})
export class FilterPanelComponent implements OnInit {
  @Output() filtersChanged = new EventEmitter<any>();

  categories: FilterCategory[] = [];
  uniqueCategories1: string[] = [];
  uniqueCategories2: string[] = [];
  uniqueCategories3: string[] = [];
  
  selectedFilters: any = {
    CATEGORY_FIELD_1: '',
    CATEGORY_FIELD_2: '',
    CATEGORY_FIELD_3: ''
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.apiService.getFilterCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.uniqueCategories1 = [...new Set(data.map(c => c.CATEGORY_FIELD_1))].filter(Boolean);
        this.uniqueCategories2 = [...new Set(data.map(c => c.CATEGORY_FIELD_2))].filter(Boolean);
        this.uniqueCategories3 = [...new Set(data.map(c => c.CATEGORY_FIELD_3))].filter(Boolean);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  onFilterChange(): void {
    const activeFilters: any = {};
    
    if (this.selectedFilters.CATEGORY_FIELD_1) {
      activeFilters.CATEGORY_FIELD_1 = [this.selectedFilters.CATEGORY_FIELD_1];
    }
    if (this.selectedFilters.CATEGORY_FIELD_2) {
      activeFilters.CATEGORY_FIELD_2 = [this.selectedFilters.CATEGORY_FIELD_2];
    }
    if (this.selectedFilters.CATEGORY_FIELD_3) {
      activeFilters.CATEGORY_FIELD_3 = [this.selectedFilters.CATEGORY_FIELD_3];
    }

    this.filtersChanged.emit(activeFilters);
  }

  resetFilters(): void {
    this.selectedFilters = {
      CATEGORY_FIELD_1: '',
      CATEGORY_FIELD_2: '',
      CATEGORY_FIELD_3: ''
    };
    this.filtersChanged.emit({});
  }
}
