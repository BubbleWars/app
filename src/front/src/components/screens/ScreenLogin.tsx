import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "../ui/button";

import { usePrivy } from "@privy-io/react-auth";

export const ScreenLogin = () => {
    const { login, ready } = usePrivy();

    return (
        <div className="screen-title">
            <Card className="w-[550px] h-[550px] flex flex-col justify-center">
                <CardHeader>
                    <CardTitle className="w-full text-center font-bold">
                        Bubblewars.io
                    </CardTitle>
                    <CardDescription className="text-center">
                        Absorb ETH. Grow your bubbles. Conquer the infinite
                        canvas.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="screen-title-buttons text-center">
                        <Button
                        disabled={!ready}
                            className="w-[100px] text-center"
                            onClick={() => {
                                login();
                            }}
                        >
                            {ready ? "Login" : "Loading..."}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
