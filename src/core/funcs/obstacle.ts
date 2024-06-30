import { Body, BodyDef, Fixture, FixtureDef, Polygon, RevoluteJoint, RevoluteJointDef, Vec2, World } from "planck-js";
import { ObstacleDef, ObstacleGroup, ObstacleGroupDef, ObstacleJointDef } from "../types/obstacle";
import { ObstacleState, ObstaclesState } from "../types/state";
import { world } from "../world";

export const setBodyId = (body: Body, id: string) => {
    body.setUserData(id);
}

export const getBodyId = (body: Body): string => {
    return body.getUserData() as string;
}

export const getBody = (world: World, id: string): Body => {
    let body = world.getBodyList();
    while (body) {
        if (getBodyId(body) === id) {
            return body;
        }
        body = body.getNext();
    }

    return world.createBody();
}

export const createObstacle = (
    world: World,
    opts: ObstacleDef,
) => {
    const body = world.createBody(opts.bodyDef);
    body.createFixture(opts.fixtureDef);
    setBodyId(body, opts.id);
   //console.log("created obstacle", opts.id, "at", body.getPosition())
    return body;
}

export const createObstacleGroup = (
    world: World,
    opts: ObstacleGroupDef,
) => {
    const bodies = opts.bodies.map((opts) => createObstacle(world, opts));
    const joints = opts.joints.map((opts) => {
        const bodyA = getBody(world, opts.bodyA);
        const bodyB = getBody(world, opts.bodyB);
        const newOpts = { ...opts.jointDef, bodyA, bodyB };
        world.createJoint(new RevoluteJoint(newOpts));
    });
    return { bodies, joints };
}

export const getBodyDef = (
    body: Body,
): BodyDef => {
    return {
        type: body.getType(),
        position: body.getPosition(),
        angle: body.getAngle(),
        linearVelocity: body.getLinearVelocity(),
        angularVelocity: body.getAngularVelocity(),
        linearDamping: body.getLinearDamping(),
        angularDamping: body.getAngularDamping(),
        allowSleep: body.isSleepingAllowed(),
        awake: body.isAwake(),
        fixedRotation: body.isFixedRotation(),
        bullet: body.isBullet(),
        active: body.isActive(),
        gravityScale: body.getGravityScale(),
    };

}

export const getFixtureDef = (
    fixture: Fixture,
): FixtureDef => {
    return {
        shape: fixture.getShape(),
        userData: fixture.getUserData(),
        friction: fixture.getFriction(),
        restitution: fixture.getRestitution(),
        density: fixture.getDensity(),
        isSensor: fixture.isSensor(),
    };
}

export const getJointDef = (
    joint: RevoluteJoint,
): Omit<RevoluteJointDef, "bodyA" | "bodyB"> => {
    return {
        localAnchorA: joint.getLocalAnchorA(),
        localAnchorB: joint.getLocalAnchorB(),
        referenceAngle: joint.getReferenceAngle(),
        lowerAngle: joint.getLowerLimit(),
        upperAngle: joint.getUpperLimit(),
        maxMotorTorque: joint.getMaxMotorTorque(),
        motorSpeed: joint.getMotorSpeed(),
        enableLimit: joint.isLimitEnabled(),
        enableMotor: joint.isMotorEnabled(),
    };
}

export const getObstacleGroupState = (
    group: ObstacleGroup[],
): ObstaclesState => {
    const obstaclesStates: ObstacleState[] = [];
    const obstacleSnapshots: ObstacleGroupDef[] = []
    group.forEach((obstacleGroup) => {

        const obstacleSnapshot = {
            bodies: [] as ObstacleDef[],
            joints: [] as ObstacleJointDef[],
        }

        //Set the obstacle group states for network transmission AND bodies for snapshot
        obstacleGroup.bodies.forEach((body) => {
            const shape = body.getFixtureList().getShape();
            const shapeType = shape.getType();
            const shapeOpts = 
                shapeType == "circle" ? {
                    radius: shape.getRadius(),
                }:
                shapeType == "polygon" ? {
                    vertices: (() => {
                        const vertices: { x: number; y: number }[] = [];
                        let vertex = (shape as Polygon).getVertex(0);
                        let i = 0;
                        while (vertex) {
                            vertices.push({ x: vertex.x, y: vertex.y });
                            vertex = (shape as Polygon).getVertex(++i);
                        }
                        return vertices;
                    })()
                }:
                undefined;
            const state = {
                id: getBodyId(body),
                shape: {
                    type: shapeType,
                    ...shapeOpts,
                },
                position: body.getPosition(),
                angle: body.getAngle(),
                linearVelocity: body.getLinearVelocity(),
                angularVelocity: body.getAngularVelocity(),
            };
            obstaclesStates.push(state);
            //console.log("pushed state", state, "at", body.getPosition())


            //Get ObstacleDef from body
            const id = getBodyId(body);
            const bodyDef = getBodyDef(body);
            const fixtureDef = getFixtureDef(body.getFixtureList());
            const obstacleDef = {
                id,
                bodyDef,
                fixtureDef,
            };
            obstacleSnapshot.bodies.push(obstacleDef);
        });

        //Set the joints for snapshot
        obstacleGroup.joints.forEach((joint) => {
            const jointDef = getJointDef(joint);
            const bodyA = getBodyId(joint.getBodyA());
            const bodyB = getBodyId(joint.getBodyB());
            obstacleSnapshot.joints.push({
                jointDef,
                bodyA,
                bodyB,
            });
        });

        obstacleSnapshots.push(obstacleSnapshot);
        
    });

    return {
        obstaclesStates,
        obstacleSnapshots,
    };

}

export const setObstacleGroupFromState = (
    world: World,
    state: ObstaclesState,
): ObstacleGroup[] => {
    const { obstacleSnapshots } = state;

    return obstacleSnapshots.map((snapshot) => {
        const bodies = snapshot.bodies.map((opts) => {
           //console.log("creating obstacle", opts)
            return createObstacle(world, opts)
        });
        const joints = snapshot.joints.map((opts) => {
            const bodyA = getBody(world, opts.bodyA);
            const bodyB = getBody(world, opts.bodyB);
            const newOpts = { ...opts.jointDef, bodyA, bodyB };
           //console.log("bodyA position", bodyA.getPosition());
            return world.createJoint(new RevoluteJoint(newOpts));
        });
        return { bodies, joints };
    });

}

export const createRotatingSquare = (
    world: World,
    id: string,
    position: Vec2,
    length: number,
): [Body, RevoluteJoint] => {

    //Create body and fixture
    const bodyDef: BodyDef = {
        type: "dynamic",
        position,
    };
    const vertices = [
        Vec2(0, 0),
        Vec2(length, 0),
        Vec2(length, length),
        Vec2(0, length),
    ];
    const fixtureDef: FixtureDef = {
        shape: Polygon(vertices),
        density: 1,
        friction: 0.3,
        restitution: 1,
    };
    
    // Calculate the centroid of the square
    const centerX = (vertices[0].x + vertices[1].x + vertices[2].x + vertices[3].x) / 4;
    const centerY = (vertices[0].y + vertices[1].y + vertices[2].y + vertices[3].y) / 4;
    const centroid = Vec2(centerX, centerY);


    const body = createObstacle(world, { id, bodyDef, fixtureDef });
    const joint = world.createJoint(new RevoluteJoint({
        localAnchorA: centroid,
        localAnchorB: Vec2(0, 0),
        bodyA: body,
        bodyB: world.createBody(),
        referenceAngle: 0,
    }));

    return  [body, joint];
}

export const createRotatingTriangle = (
    world: World,
    id: string,
    position: Vec2,
    length: number,
): [Body, RevoluteJoint] => {

    //Create body and fixture
    const bodyDef: BodyDef = {
        type: "dynamic",
        position,
    };
    const vertices = [
        Vec2(0, 0),
        Vec2(length, 0),
        Vec2(0, length)
    ];
    const fixtureDef: FixtureDef = {
        shape: Polygon(vertices),
        density: 1,
        friction: 0.3,
        restitution: 1,
    };
    
    // Calculate the centroid of the triangle
    const centerX = (vertices[0].x + vertices[1].x + vertices[2].x) / 3;
    const centerY = (vertices[0].y + vertices[1].y + vertices[2].y) / 3;
    const centroid = Vec2(centerX, centerY);
   //console.log("triangle centroid", centroid)
   //console.log("creating triangle at", position)


    const body = createObstacle(world, { id, bodyDef, fixtureDef });
    const joint = world.createJoint(new RevoluteJoint({
        localAnchorA: centroid,
        localAnchorB: position,
        bodyA: body,
        bodyB: world.createBody(),
        referenceAngle: 0,
    }));

   //console.log("position after joint", body.getPosition())

    return  [body, joint];
}
    


export const generateObstacles = (
    world: World,
    obstacles: ObstacleGroup[],
    count: number,
) => {
    // const length = 2;
    // const gap = 1;
    // const start = -count / 2 * (length + gap);
    // for (let i = 0; i < count; i++) {
    //     const position = Vec2(start + i * (length + gap), 0);
    //     const isSquare = i % 2 === 0;
    //     const [body, joint] = isSquare ? createRotatingSquare(world, i.toString(), position, length) : createRotatingTriangle(world, i.toString(), position, length);
    //     obstacles.push({ bodies: [body], joints: [joint] });
    // }

    //create on triangle
    const position = Vec2(0, -30);
    const length = 4;
    const [body, joint] = createRotatingTriangle(world, "69", position, length);
    obstacles.push({ bodies: [body], joints: [joint] });
}

