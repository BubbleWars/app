import { Body, Fixture } from "planck-js";
import { Address } from "./address";

export interface Entity {
  owner: Address,
  balance: number,
  body: Body,
  fixture: Fixture,
}