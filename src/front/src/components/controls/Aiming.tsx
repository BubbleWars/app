import { useOnClick, useOnRightClick } from "@/hooks/inputs";
import { useAiming, useAimingFire, useAimingLine, useAimingMass, useAimingResource, useClearAiming, useIsAiming } from "@/hooks/state"
import { Line } from "@react-three/drei";
import { CustomText } from "../CustomText";
import { ResourceTypeToName } from "../BubblesInfo";

export const Aiming = () => {
    const show = useIsAiming();
    const type  = useAimingResource();
    const mass = useAimingMass();
    const [p1, p2, dir] = useAimingLine();
    const fire = useAimingFire(mass, dir);
    const clear = useClearAiming();

    useOnClick(() => {
        if(show)
            fire();
    })

    useOnRightClick(() => {
        clear();
    })

    if(!show) return null


    return (
        <>
            <Line
                color={"grey"}
                lineWidth={3}
                dashed={true}
                points={[p1,p2]}
            />
            <CustomText
                size={0.5}
                color="white"
                position={p2}
            >
                {`Emit \n`}
                {mass.toFixed(4)} {ResourceTypeToName[type]}
            </CustomText>
        </>
    )

}