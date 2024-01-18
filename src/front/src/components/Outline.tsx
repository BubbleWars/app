import * as THREE from 'three'; 
import { useEffect, useRef, useMemo } from 'react';
import { useThree, useFrame, extend } from '@react-three/fiber';
import { OutlinePass, RenderPass, EffectComposer } from 'three/examples/jsm/Addons.js';

extend({ EffectComposer, RenderPass, OutlinePass });

const Outline = ({ children, edgeColor = '#ffffff', edgeStrength = 3, edgeThickness = 1 }) => {
  const { gl, scene, camera, size } = useThree();
  const composer = useRef();
  const aspect = useMemo(() => new Vector2(size.width, size.height), [size]);

  useEffect(() => {
    if (!composer.current) {
      composer.current = new EffectComposer(gl);
      composer.current.addPass(new RenderPass(scene, camera));

      const outlinePass = new OutlinePass(aspect, scene, camera);
      outlinePass.visibleEdgeColor.set(edgeColor);
      outlinePass.edgeStrength = edgeStrength;
      outlinePass.edgeThickness = edgeThickness;
      composer.current.addPass(outlinePass);
    }

    composer.current.setSize(size.width, size.height);
  }, [edgeColor, edgeStrength, edgeThickness, gl, scene, camera, size, aspect]);

  useFrame(() => composer.current?.render(), 1);

  return (
    <>
      {children}
      <effectComposer ref={composer} args={[gl]}>
        <renderPass attachArray="passes" args={[scene, camera]} />
        <outlinePass attachArray="passes" args={[aspect, scene, camera, []]} />
        {/* You can add other passes like ShaderPass here if needed */}
      </effectComposer>
    </>
  );
};

export default Outline;
