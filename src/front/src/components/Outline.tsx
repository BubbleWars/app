import ReactDOM from "react-dom"
import React, { useRef, useEffect, useMemo, useState, useContext, useCallback } from "react"
import { Vector2 } from "three"
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer"
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass"
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass"
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader"
const context = React.createContext([])
extend({ OrbitControls, EffectComposer, RenderPass, OutlinePass, ShaderPass })
export const Outline = ({ children }) => {
    const { gl, scene, camera, size } = useThree()
    const composer = useRef()
    const [hovered, set] = useState([])
    const aspect = useMemo(() => new Vector2(size.width, size.height), [size])
    useEffect(() => composer.current.setSize(size.width, size.height), [size])
    useFrame(() => composer.current.render(), 1)
    return (
      <context.Provider value={set}>
        {children}
        <effectComposer ref={composer} args={[gl]}>
          <renderPass attachArray="passes" args={[scene, camera]} />
          <oulinePass
            attachArray="passes"
            args={[aspect, scene, camera]}
            selectedObjects={hovered}
            visibleEdgeColor="black"
            edgeStrength={50}
            edgeThickness={1}
          />
          <shaderPass attachArray="passes" args={[FXAAShader]} uniforms-resolution-value={[1 / size.width, 1 / size.height]} />
        </effectComposer>
      </context.Provider>
    )
  }