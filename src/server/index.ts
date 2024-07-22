import {
    parseInput,
    handleInput,
    parseInspect,
    handleInspect,
} from "../core/funcs/inputs";
import { init } from "../core/world";

const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;
const dapp_address = process.env.ROLLUP_CONTRACT_ADDRESS;
console.log("Dapp address is " + dapp_address);
console.log("HTTP rollup_server url is " + rollup_server);

init();

async function handle_advance(data) {
    try {    
        console.log("Received advance request data" + data);
        const input = parseInput(data);
        //console.log("Parsed input " + JSON.stringify(input));
        if (!input) return "reject";
        const handled = await handleInput(input);
        if (handled) {
            console.log("Handled input " + JSON.stringify(input));
            return "accept";
        }
        return "reject";
    }
    catch (error) {
        console.error("Error in handle_advance:", error);
        return "reject";
    }
}

async function handle_inspect(data) {
    try {
        console.log("Received inspect request data " + data);
        const inspect = parseInspect(data);
        if (!inspect) return "reject";
        console.log("Parsed inspect " + JSON.stringify(inspect));
        await handleInspect(inspect);
        return "accept";
    }
    catch (error) {
        console.error("Error in handle_inspect:", error);
        return "reject";
    }
}

var handlers = {
    advance_state: handle_advance,
    inspect_state: handle_inspect,
};

var finish = { status: "accept" };

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
    while (true) {
        try {
            console.log("Making request", rollup_server + "/finish");
            const finish_req = await fetch(rollup_server + "/finish", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: "accept" }),
            });

            console.log("Received finish status " + finish_req.status);

            if (finish_req.status == 202) {
                console.log("No pending rollup request, trying again");
            } else {
                const rollup_req = await finish_req.json();
                var handler = handlers[rollup_req["request_type"]];
                finish["status"] = await handler(rollup_req["data"]);
            }
        } catch (error) {
            console.error("Error in request loop:", error);
        }
        await delay(10000); // Delay of 10 seconds
    }
})();
