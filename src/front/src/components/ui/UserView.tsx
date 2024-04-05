import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { truncateAddress } from "../../../../core/funcs/utils"

export const UserView = ({ address }: { address: string }) => {

    return (
        <div className="flex flex-row items-center">
            <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div className="flex flex-col ml-2">
                <span className="text-sm font-semibold">{truncateAddress(address)}</span>
                <span className="text-xs text-gray-500">{truncateAddress(address)}</span>
            </div>
        </div>
    )
}