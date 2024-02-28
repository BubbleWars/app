import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Snapshot } from "../../../core/types/state";
import { Notice } from "../generated-src/graphql";
import { CustomCameraControls } from "./CameraControls";
import { Portals } from "./Portals";
import { Bubbles } from "./Bubbles";
import { useEffect } from "react";
import { init, world } from "../../../core/world";
