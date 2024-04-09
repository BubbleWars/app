import { useEffect, useMemo } from "react";
import { truncateAddress } from "../../../core/funcs/utils";

export interface UserSocial {
    address: string;
    pfpUrl: string;
    social: string;
    privyId: string;
}

export const userSocialsState: { [address: string]: UserSocial } = {};

export const useUserSocial = ({ address }: { address: string }) => {
    return useMemo(() => {
        return userSocialsState[address];
    }, [address, userSocialsState]);
};
