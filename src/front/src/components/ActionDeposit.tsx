import { useState } from "react"
import { InputType } from "../../../core/types/inputs"
import { useCreateInput } from "../hooks/inputs"

export const ActionDeposit = () => {
    const [amount, setAmount] = useState(1)
    const { 
        write,
        isError, 
        isLoading, 
        isSuccess
    } = useCreateInput({
        type: InputType.Deposit, 
        amount: 1000,
    })

    return (
        <button 
            disabled={isError || isLoading}
            onClick={() => write?.()}
        >
            <p>Deposit</p>
            <input type="number" value={amount} onChange={(e) => setAmount(parseInt(e.target.value))} />
            <p>{isError ? 'Error' : isLoading ? 'Loading' : isSuccess ? 'Success' : 'Idle'}</p>
        </button>
    )
}