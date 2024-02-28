import { Address } from "../../../core/types/address";
import { InputType } from "../../../core/types/inputs";
import { useCreateInput } from "../hooks/inputs";

export const ActionEmit = ({ address }: { address: Address }) => {
    const { write, isError, isLoading, isSuccess } = useCreateInput({
        type: InputType.Emit,
        mass: 1,
        from: address,
    });

    return (
        <button disabled={isError || isLoading} onClick={() => write?.()}>
            <p>Emit</p>
            <p>
                {isError
                    ? "Error"
                    : isLoading
                      ? "Loading"
                      : isSuccess
                        ? "Success"
                        : "Idle"}
            </p>
        </button>
    );
};
