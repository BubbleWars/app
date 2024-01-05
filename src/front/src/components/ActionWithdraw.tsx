import { InputType } from "../../../core/types/inputs"
import { useCreateInput } from "../hooks/inputs"

export const ActionWithdraw = () => {
    const { 
        write,
        isError, 
        isLoading, 
        isSuccess
    } = useCreateInput({
        type: InputType.Withdraw, 
        amount: 1,
    })

    return (
        <button 
            disabled={isError || isLoading}
            onClick={() => write?.()}
        >
            <p>Withdraw</p>
            <p>{isError ? 'Error' : isLoading ? 'Loading' : isSuccess ? 'Success' : 'Idle'}</p>
        </button>
    )
}