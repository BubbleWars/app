import { Polygon, Vec2, World } from "planck-js";
import { Obstacle } from "../types/obstacle";

export const createObstacle = (
  obstsables: Map<string, Obstacle>,
  world: World,
  position: Vec2,
  vertices: Vec2[],
): Obstacle => {
  const obstacle = world.createBody({
    position: position,
    type: "static",
  });
  const fixture = obstacle.createFixture({
    shape: new Polygon(vertices),
    density: 1,
    friction: 0,
  });
  const id = obstacle.getUserData() as string;
  obstsables.set(id, { body: obstacle, fixture: fixture });
  return { body: obstacle, fixture: fixture };
};
