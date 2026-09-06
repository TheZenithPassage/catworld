import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';

import { Cat, CatLookup } from '../../features/cats/models/cat.model';
import { CatApiService } from '../../features/cats/services/cat-api.service';
import { Owner, OwnerLookup } from '../../features/owners/models/owner.model';
import { OwnerApiService } from '../../features/owners/services/owner-api.service';
import { Vet, VetLookup } from '../../features/vets/models/vet.model';
import { VetApiService } from '../../features/vets/services/vet-api.service';
import {
  EntityLookupAdapter,
  EntityLookupInitialSelection,
  EntityLookupPresentation,
} from './entity-lookup.models';

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
    const currentCats = value.currentCats.map((cat) => cat.name).join(', ');
    return {
      primary: value.fullName,
      secondary: currentCats || undefined,
      selected: currentCats ? `${value.fullName} (${currentCats})` : value.fullName,
    };
  }
  fromCrud(value: Owner): EntityLookupInitialSelection {
    return { id: value.id, label: value.fullName };
  }
}

@Injectable({ providedIn: 'root' })
export class CatLookupAdapter implements EntityLookupAdapter<CatLookup> {
  private readonly api = inject(CatApiService);
  resolve(id: string) {
    return this.api
      .getCatById(id)
      .pipe(map(({ id, name, ownerId, ownerName }) => ({ id, name, ownerId, ownerName })));
  }
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
  fromCrud(value: Cat): EntityLookupInitialSelection {
    return { id: value.id, label: `${value.name} — ${value.ownerName}` };
  }
}

@Injectable({ providedIn: 'root' })
export class VetLookupAdapter implements EntityLookupAdapter<VetLookup> {
  private readonly api = inject(VetApiService);
  search(query: string, page: number) {
    return this.api.searchVets(query, page);
  }
  resolve(id: string) {
    return this.api.getVetById(id).pipe(map((value) => ({ id: value.id, name: value.name })));
  }
  id(value: VetLookup): string {
    return value.id;
  }
  present(value: VetLookup): EntityLookupPresentation {
    return { primary: value.name, selected: value.name };
  }
  fromCrud(value: Vet): EntityLookupInitialSelection {
    return { id: value.id, label: value.name };
  }
}
