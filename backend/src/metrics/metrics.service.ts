import { Injectable } from '@nestjs/common';
import { Counter, Histogram } from 'prom-client';
import { getCurrentCompanyId } from '../common/tenant/tenant-context';

interface LabelOptions {
  route?: string;
  companyId?: number;
  status?: string;
}

@Injectable()
export class MetricsService {
  private counters: Record<string, Counter<string>> = {};
  private histograms: Record<string, Histogram<string>> = {};

  incrementCounter(name: string, labels: LabelOptions = {}): void {
    const counter =
      this.counters[name] ||
      (this.counters[name] = new Counter({
        name,
        help: `${name} counter`,
        labelNames: ['route', 'companyId', 'status'],
      }));
    const { route, companyId, status } = this.getLabelValues(labels);
    counter.labels(route, companyId, status).inc();
  }

  observeHistogram(
    name: string,
    value: number,
    labels: LabelOptions = {},
  ): void {
    const histogram =
      this.histograms[name] ||
      (this.histograms[name] = new Histogram({
        name,
        help: `${name} histogram`,
        labelNames: ['route', 'companyId', 'status'],
      }));
    const { route, companyId, status } = this.getLabelValues(labels);
    histogram.labels(route, companyId, status).observe(value);
  }

  private getLabelValues(labels: LabelOptions) {
    return {
      route: labels.route ?? 'unknown',
      companyId: String(labels.companyId ?? getCurrentCompanyId() ?? 'unknown'),
      status: labels.status ?? 'unknown',
    };
  }
}
