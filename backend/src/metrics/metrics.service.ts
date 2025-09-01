import { Injectable } from '@nestjs/common';
import { Counter, Histogram } from 'prom-client';

import { getCurrentCompanyId } from '../common/tenant/tenant-context';

type LabelOptions = {
  companyId?: number;
  route?: string;
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
        help: `${name} counter`,
        labelNames: ['route', 'companyId', 'status'],
        name,
      }));
    const { companyId, route, status } = this.getLabelValues(labels);
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
        help: `${name} histogram`,
        labelNames: ['route', 'companyId', 'status'],
        name,
      }));
    const { companyId, route, status } = this.getLabelValues(labels);
    histogram.labels(route, companyId, status).observe(value);
  }

  private getLabelValues(labels: LabelOptions) {
    return {
      companyId: String(labels.companyId ?? getCurrentCompanyId() ?? 'unknown'),
      route: labels.route ?? 'unknown',
      status: labels.status ?? 'unknown',
    };
  }
}
