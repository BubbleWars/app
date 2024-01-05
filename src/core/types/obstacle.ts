import { Body, Fixture, Vec2 } from "planck-js";

export interface Obstacle {
    body: Body,
    fixture: Fixture,
    vertices: Vec2[],
}