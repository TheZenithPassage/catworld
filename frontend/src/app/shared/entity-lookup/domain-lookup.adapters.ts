import { inject, Injectable } from '@angular/core';

import { Cat, CatLookup } from '../../features/cats/models/cat.model';
import { CatApiService } from '../../features/cats/services/cat-api.service';
import { Owner, OwnerLookup } from '../../features/owners/models/owner.model';
import { OwnerApiService } from '../../features/owners/services/owner-api.service';
import { Vet, VetLookup } from '../../features/vets/models/vet.model';
import { VetApiService } from '../../features/vets/services/vet-api.service';
import { EntityLookupAdapter, EntityLookupPresentation } from './entity-lookup.models';

@Injectable({ providedIn: 'root' })
export class OwnerLookupAdapter implements EntityLookupAdapter<OwnerLookup> {
  private readonly api = inject(OwnerApiService);
  search(query: string, page: number) {
    return this.api.searchOwners(query, page);
  }
  resolve(id: string) {
    return this.api.getOwnerLookup(id);
  }
  id(value: OwnerLookup): string {
    return value.id;
  }
  present(value: OwnerLookup): EntityLookupPresentation {
    return {
      primary: value.fullName,
      secondary: value.currentCats.map((cat) => cat.name).join(', ') || undefined,
      selected: value.fullName,
    };
  }
  fromCrud(value: Owner): OwnerLookup {
    return { id: value.id, fullName: value.fullName, currentCats: [] };
  }
}

@Injectable({ providedIn: 'root' })
export class CatLookupAdapter implements EntityLookupAdapter<CatLookup> {
  private readonly api = inject(CatApiService);
  search(query: string, page: number) {
    return this.api.searchCats(query, page);
  }
  id(value: CatLookup): string {
    return value.id;
  }
  present(value: CatLookup): EntityLookupPresentation {
    return {
      primary: value.name,
      secondary: value.ownerName,
      selected: `${value.name} — ${value.ownerName}`,
    };
  }
  fromCrud(value: Cat): CatLookup {
    return { id: value.id, name: value.name, ownerId: value.ownerId, ownerName: value.ownerName };
  }
}

@Injectable({ providedIn: 'root' })
export class VetLookupAdapter implements EntityLookupAdapter<VetLookup> {
  private readonly api = inject(VetApiService);
  search(query: string, page: number) {
    return this.api.searchVets(query, page);
  }
  id(value: VetLookup): string {
    return value.id;
  }
  present(value: VetLookup): EntityLookupPresentation {
    return { primary: value.name, selected: value.name };
  }
  fromCrud(value: Vet): VetLookup {
    return { id: value.id, name: value.name };
  }
}
