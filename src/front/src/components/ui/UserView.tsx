import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { truncateAddress } from "../../../../core/funcs/utils"
import { TwitterLogoIcon } from "@radix-ui/react-icons"

export const UserView = ({ address }: { address: string }) => {

    return (
        <div className="flex flex-row items-center">
            <Avatar>
                <AvatarImage src="https://pbs.twimg.com/profile_images/1775519317024542720/d3H28anA_400x400.jpg" alt="@shadcn" />
                <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div className="flex flex-col ml-2">
                <div className="text-sm flex items-center space-x-2"><span className="font-semibold underline">@glockchain</span> <TwitterLogoIcon className="h-3 w-3" /> </div>
                <span className="text-xs text-gray-500">{truncateAddress(address)}</span>
            </div>
        </div>
    )
}