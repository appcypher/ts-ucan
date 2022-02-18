import * as abilities from "./capability/ability"
import * as resourcePointers from "./capability/resource-pointer"
import * as util from "./util"

import { Ability, isAbility } from "./capability/ability"
import { ResourcePointer, isResourcePointer } from "./capability/resource-pointer"
import { Superuser, SUPERUSER } from "./capability/super-user"


// RE-EXPORTS


export { abilities, resourcePointers }



// 💎


export type Capability = {
  with: ResourcePointer
  can: Ability
}

export type EncodedCapability = {
  with: string,
  can: string
}



// TYPE CHECKS


export function isCapability(obj: unknown): obj is Capability {
  return util.isRecord(obj)
    && util.hasProp(obj, "with") && isResourcePointer(obj.with)
    && util.hasProp(obj, "can") && isAbility(obj.can)
}



// 🌸


export function as(identifier: string): Capability {
  return {
    with: resourcePointers.as(identifier),
    can: SUPERUSER
  }
}


export function my(resource: Superuser | string): Capability {
  return {
    with: resourcePointers.my(resource),
    can: SUPERUSER
  }
}


export function prf(selector: Superuser | number, ability: Ability): Capability {
  return {
    with: resourcePointers.prf(selector),
    can: ability
  }
}



// ENCODING


/**
 * Encode the individual parts of a capability.
 *
 * @param cap The capability to encode
 */
export function encode(cap: Capability): EncodedCapability {
  return {
    with: resourcePointers.encode(cap.with),
    can: abilities.encode(cap.can)
  }
}