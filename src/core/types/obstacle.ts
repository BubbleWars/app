import { Body, BodyDef, FixtureDef, Joint, JointDef, RevoluteJoint, RevoluteJointDef } from "planck-js";
import { ShapeType } from "planck-js/lib/shape";

export type CustomRevoluteJointDef = Omit<RevoluteJointDef, 'bodyA' | 'bodyB'>;

export interface ObstacleDef {
    id: string;
    bodyDef: BodyDef;
    fixtureDef: FixtureDef;
}

export interface ObstacleJointDef {
    jointDef: CustomRevoluteJointDef;
    bodyA: string;
    bodyB: string;
}

export interface ObstacleGroupDef {
    bodies: ObstacleDef[]
    joints: ObstacleJointDef[]
}

export interface ObstacleGroup {
    bodies: Body[];
    joints: RevoluteJoint[],
}

