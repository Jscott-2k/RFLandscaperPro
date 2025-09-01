import { CommonModule } from '@angular/common';
import { Component, type OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ContractsService, type Contract } from './contracts.service';

@Component({
  imports: [CommonModule, RouterModule],
  selector: 'app-contract-list',
  standalone: true,
  templateUrl: './contract-list.component.html',
})
export class ContractListComponent implements OnInit {
  private contractsService = inject(ContractsService);
  contracts: Contract[] = [];

  ngOnInit(): void {
    this.contractsService.list().subscribe((contracts) => (this.contracts = contracts));
  }

  cancel(id: number): void {
    this.contractsService.cancel(id).subscribe(() => {
      this.contracts = this.contracts.filter((c) => c.id !== id);
    });
  }
}
