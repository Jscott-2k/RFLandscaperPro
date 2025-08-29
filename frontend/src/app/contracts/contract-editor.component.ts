import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ContractsService, Contract } from './contracts.service';

@Component({
  selector: 'app-contract-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './contract-editor.component.html',
})
export class ContractEditorComponent implements OnInit {
  private contractsService = inject(ContractsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  contract: Contract = {
    customerId: 1,
    startDate: '',
    frequency: 'WEEKLY',
    jobTemplate: { title: '' },
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const contractId = Number(id);
      if (!isNaN(contractId)) {
        this.contractsService.get(contractId).subscribe((contract) => (this.contract = contract));
      }
    }
  }

  save(): void {
    if (this.contract.id) {
      this.contractsService.update(this.contract.id, this.contract).subscribe(() => {
        void this.router.navigate(['/contracts']);
      });
    } else {
      this.contractsService.create(this.contract).subscribe(() => {
        void this.router.navigate(['/contracts']);
      });
    }
  }
}
