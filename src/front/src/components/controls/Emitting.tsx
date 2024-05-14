import { useOnClick } from "@/hooks/inputs";
import { useAiming, useAimingFire, useAimingLine, useAimingMass, useAimingResource, useEmissions, useIsAiming } from "@/hooks/state"
import { Line } from "@react-three/drei";
import { CustomText } from "../CustomText";
import { ResourceTypeToName } from "../BubblesInfo";

export const Emitting = () => {
    const emits = useEmissions();
   //console.log("emits", emits)
    return (
        <>
            {emits.map(({id, mass, type, p1, p2}, index) => {
                if(!id) return null
                return(
                    <group key={index}>
                        <Line
                            color={"grey"}
                            lineWidth={2}
                            dashed={true}
                            points={[p1, p2]}
                        />

                        <CustomText
                            size={0.5}
                            color="white"
                            position={p2}
                        >
                            {`Emitting `}  {mass} {" "} {ResourceTypeToName[type]}
                        </CustomText>
                    </group>
                )
            
            })}
        </>
    )

}