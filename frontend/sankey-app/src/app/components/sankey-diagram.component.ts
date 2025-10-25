import { Component, OnInit, ElementRef, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, SankeyNode, SankeyLink, SankeyNodeMinimal, SankeyLinkMinimal } from 'd3-sankey';
import { SankeyData } from '../services/api.service';

type SankeyNodeExtra = { name: string };
type SankeyLinkExtra = { category?: string; color?: string };

type SankeyNodeInput = SankeyNodeMinimal<SankeyNodeExtra, SankeyLinkExtra> & SankeyNodeExtra;
type SankeyLinkInput = SankeyLinkMinimal<SankeyNodeExtra, SankeyLinkExtra> & SankeyLinkExtra & { value: number };

@Component({
  selector: 'app-sankey-diagram',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sankey-container">
      <svg #sankeyCanvas></svg>
      <div *ngIf="!data || data.length === 0" class="no-data">
        No data available. Please adjust your filters.
      </div>
    </div>
  `,
  styles: [`
    .sankey-container {
      width: 100%;
      height: 600px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: auto;
    }

    svg {
      width: 100%;
      height: 100%;
    }

    .no-data {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #999;
      font-size: 18px;
    }
  `]
})
export class SankeyDiagramComponent implements OnInit, OnChanges {
  @ViewChild('sankeyCanvas', { static: true }) sankeyCanvas!: ElementRef<SVGElement>;
  @Input() data: SankeyData[] = [];
  @Input() onNodeClick?: (nodeName: string) => void;

  private width = 1200;
  private height = 600;
  private colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  ngOnInit(): void {
    this.renderSankey();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && !changes['data'].firstChange) {
      this.renderSankey();
    }
  }

  private renderSankey(): void {
    if (!this.data || this.data.length === 0) {
      return;
    }

    const svg = d3.select(this.sankeyCanvas.nativeElement);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 150, bottom: 20, left: 150 };
    const width = this.width - margin.left - margin.right;
    const height = this.height - margin.top - margin.bottom;

    const g = svg
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const nodeNames = new Set<string>();
    this.data.forEach(d => {
      nodeNames.add(d.SOURCE);
      nodeNames.add(d.TARGET);
    });

    const nodes: SankeyNodeInput[] = Array.from(nodeNames).map(name => ({ name }));
    const nodeMap = new Map(nodes.map((node, i) => [node.name, i]));

    const links: SankeyLinkInput[] = this.data.map(d => ({
      source: nodeMap.get(d.SOURCE)!,
      target: nodeMap.get(d.TARGET)!,
      value: d.VALUE,
      category: d.VALUE_SPLIT_CATEGORY || 'default'
    }));

    const sankeyGenerator = sankey<SankeyNodeExtra, SankeyLinkExtra>()
      .nodeWidth(15)
      .nodePadding(10)
      .extent([[0, 0], [width, height]]);

    const graph = sankeyGenerator({
      nodes,
      links
    });

    graph.links.forEach(link => {
      link.color = this.colorScale(link.category || 'default');
    });

    const link = g.append('g')
      .selectAll('.link')
      .data(graph.links)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', d => d.color || '#ccc')
      .attr('stroke-width', (d: any) => Math.max(1, d.width))
      .attr('fill', 'none')
      .attr('opacity', 0.5)
      .on('mouseover', function() {
        d3.select(this).attr('opacity', 0.8);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.5);
      });

    link.append('title')
      .text((d: any) => `${d.source.name} → ${d.target.name}\nValue: ${d.value}`);

    const node = g.append('g')
      .selectAll('.node')
      .data(graph.nodes)
      .enter()
      .append('g')
      .attr('class', 'node');

    node.append('rect')
      .attr('x', (d: any) => d.x0)
      .attr('y', (d: any) => d.y0)
      .attr('height', (d: any) => d.y1 - d.y0)
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('fill', (d, i) => this.colorScale(i.toString()))
      .attr('stroke', '#000')
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        if (this.onNodeClick) {
          this.onNodeClick(d.name);
        }
      });

    node.append('text')
      .attr('x', (d: any) => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr('y', (d: any) => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: any) => d.x0 < width / 2 ? 'start' : 'end')
      .text(d => d.name)
      .attr('font-size', '12px')
      .attr('fill', '#333');

    node.append('title')
      .text((d: any) => `${d.name}\nValue: ${d.value}`);
  }
}
