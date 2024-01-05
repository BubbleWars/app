import { InputType } from "../../../core/types/inputs"
import { useCreateInput } from "../hooks/inputs"

export const ActionSpawnPortal = () => {
    const { 
        write,
        isError, 
        isLoading, 
        isSuccess
    } = useCreateInput({
        type: InputType.SpawnPortal, 
        mass: 10,
    })

    return (
        <button 
            disabled={isError || isLoading}
            onClick={() => write?.()}
        >
            <p>Spawn Portal</p>
            <p>{isError ? 'Error' : isLoading ? 'Loading' : isSuccess ? 'Success' : 'Idle'}</p>
        </button>
    )
}