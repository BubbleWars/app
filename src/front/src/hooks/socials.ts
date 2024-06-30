import { useEffect, useMemo } from "react";
import { truncateAddress } from "../../../core/funcs/utils";
import { a } from "vitest/dist/suite-a18diDsI.js";

export interface UserSocial {
    address: string;
    pfpUrl: string;
    social: string;
    privyId: string;
}

export const userSocialsState: { [address: string]: UserSocial } = {};

export const useUserSocial = ({ address }: { address: string }) => {
   //console.log("useUserSocial", userSocialsState);
    return useMemo(() => {
        if (!address) return {
            social: address,
            pfpUrl: "https://www.shutterstock.com/image-vector/default-avatar-profile-icon-social-600nw-1677509740.jpg",
            privyId: "",
        }
        return userSocialsState[address.toLowerCase()];
    }, [address, userSocialsState]);
};
