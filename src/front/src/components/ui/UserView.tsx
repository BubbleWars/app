import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { truncateAddress } from "../../../../core/funcs/utils"
import { TwitterLogoIcon } from "@radix-ui/react-icons"
import { useUserSocial } from "@/hooks/socials";

export const UserView = ({ address }: { address: string }) => {
    const user = useUserSocial({ address });
   //console.log("UserView", user);
    return (
        <div className="flex flex-row items-center">
            <Avatar>
            <AvatarImage src={user?.pfpUrl ?? "https://pbs.twimg.com/profile_images/1775519317024542720/d3H28anA_400x400.jpg"} alt="@shadcn" />
                <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div className="flex flex-col ml-2">
                <div className="text-sm flex items-center space-x-2"><span className="font-semibold underline">@{user?.social ?? "not signed in"}</span> <TwitterLogoIcon className="h-3 w-3" /> </div>
                <span className="text-xs text-gray-500">{truncateAddress(address)}</span>
            </div>
        </div>
    )
}

export const SmallUserView = ({ address }: { address: string }) => {
    const user = useUserSocial({ address });
    return (
        <div className="flex flex-row items-center">
            <Avatar className="w-6 h-6">
                <AvatarImage src={user?.pfpUrl ?? "https://pbs.twimg.com/profile_images/1775519317024542720/d3H28anA_400x400.jpg"} alt="@shadcn" />
                <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div className="text-xs flex items-center space-x-2"><span className="font-semibold underline">@{user?.social ?? "not signed in"}</span> <TwitterLogoIcon className="h-3 w-3" /> </div>
        </div>
    )
}