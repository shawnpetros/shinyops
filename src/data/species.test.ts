import { describe, it, expect } from 'vitest';
import { speciesById } from './species';

describe('regional form availability', () => {
  it('Hisuian Sneasel is catchable in PLA only and transfer-only in mainline games', () => {
    const s = speciesById['sneasel-hisui'];
    expect(s).toBeDefined();
    expect(s.availabilityByGame.la).toEqual({ catchable: true });
    expect(s.availabilityByGame.sv?.transferOnly).toBe(true);
    expect(s.availabilityByGame.sw?.transferOnly).toBe(true);
    expect(s.availabilityByGame.sh?.transferOnly).toBe(true);
    expect(s.availabilityByGame.bdsp?.transferOnly).toBe(true);
    // Critical regression: Hisuian Sneasel must NOT inherit base Sneasel's
    // catchable-in-Paldea status.
    expect(s.availabilityByGame.sv?.transferOnly).toBe(true);
    expect(s.availabilityByGame.za).toBeUndefined();
  });

  it('regular Sneasel keeps its base PokeAPI-derived availability', () => {
    const s = speciesById['sneasel'];
    expect(s).toBeDefined();
    expect(s.availabilityByGame.sv?.catchable).toBe(true);
    expect(s.availabilityByGame.sv?.transferOnly).toBeUndefined();
    expect(s.availabilityByGame.la?.catchable).toBe(true);
  });

  it('Galarian Articuno is catchable in SwSh and transfer-only elsewhere', () => {
    const s = speciesById['articuno-galar'];
    expect(s).toBeDefined();
    expect(s.availabilityByGame.sw).toEqual({ catchable: true });
    expect(s.availabilityByGame.sh).toEqual({ catchable: true });
    expect(s.availabilityByGame.sv?.transferOnly).toBe(true);
  });

  it('Alolan Vulpix is catchable in SwSh (Crown Tundra) and transfer-only elsewhere', () => {
    const s = speciesById['vulpix-alola'];
    expect(s).toBeDefined();
    expect(s.availabilityByGame.sw?.catchable).toBe(true);
    expect(s.availabilityByGame.sh?.catchable).toBe(true);
    expect(s.availabilityByGame.sv?.transferOnly).toBe(true);
  });

  it('Paldean Wooper is catchable in SV and transfer-only elsewhere', () => {
    const s = speciesById['wooper-paldea'];
    expect(s).toBeDefined();
    expect(s.availabilityByGame.sv).toEqual({ catchable: true });
    expect(s.availabilityByGame.sw?.transferOnly).toBe(true);
  });
});
