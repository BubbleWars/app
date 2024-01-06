import * as THREE from 'three'
import { useEffect, useRef } from "react"
import { massToRadius } from '../../../core/funcs/utils'
import { currentState } from '../../../core/world'
import { useFrame } from '@react-three/fiber'
import { PortalState } from '../../../core/types/state'
import { snapshotCurrentState } from '../../../core/snapshots'

export const Portals = ({ portals, temp = new THREE.Object3D() } : { portals: string[], temp?: THREE.Object3D }) => {
    const instancedMeshRef = useRef<any>()

    // Initialize portals
    useEffect(() => {
        // Set positions
        for (let i = 0; i < portals.length; i++) {
            const portal: PortalState | undefined = snapshotCurrentState.portals.find(portal => portal.id === portals[i])
            if(!portal) return
            //Set radius
            const radius = massToRadius(portal.mass)
            temp.scale.set(radius, radius, radius)
            //Set position
            temp.position.set(portal.position.x, portal.position.y, 0)
            temp.updateMatrix()
            instancedMeshRef.current.setMatrixAt(i, temp.matrix)
        }
        // Update the instance
        instancedMeshRef.current.instanceMatrix.needsUpdate = true
    }, [portals])

    // Update portal radii
    useFrame(() => {
        // Set radius
        for (let i = 0; i < portals.length; i++) {
            const portal = currentState.portals.find(portal => portal.id == portals[i])
            if(!portal) return
            //Set radius
            const radius = massToRadius(portal.mass)
            temp.scale.set(radius, radius, radius)
            //Set position
            temp.position.set(portal.position.x, portal.position.y, 0)
            temp.updateMatrix()
            instancedMeshRef.current.setMatrixAt(i, temp.matrix)
        }
        // Update the instance
        instancedMeshRef.current.instanceMatrix.needsUpdate = true
    })
    return (
        <instancedMesh ref={instancedMeshRef} args={[null, null, portals.length]}>
        <sphereGeometry />
        <meshPhongMaterial 
            opacity={0.8}
            color='black'
            transparent
            />
        </instancedMesh>
    )
}