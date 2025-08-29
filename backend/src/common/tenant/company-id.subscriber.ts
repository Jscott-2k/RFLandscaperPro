import { EntitySubscriberInterface, EventSubscriber, BeforeQueryEvent } from 'typeorm';
import { getCurrentCompanyId } from './tenant-context';

@EventSubscriber()
export class CompanyIdSubscriber implements EntitySubscriberInterface {
  async beforeQuery(event: BeforeQueryEvent<any>): Promise<void> {
    const companyId = getCurrentCompanyId();
    if (companyId === undefined) return;
    if (event.query.startsWith('SET app.current_company_id')) return;
    await event.queryRunner.query(`SET app.current_company_id = ${companyId}`);
  }
}
