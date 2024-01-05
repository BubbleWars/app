import { 
  parseInput, 
  handleInput,
  parseInspect,
  handleInspect,
} from "../core/funcs/inputs";
import { init } from "../core/world";

const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;
console.log("HTTP rollup_server url is " + rollup_server);

init();

async function handle_advance(data) {
  console.log("Received advance request data" + JSON.stringify(data));
  const input = parseInput(data);
  console.log("Parsed input " + JSON.stringify(input));
  if (!input) return "reject";
  if (await handleInput(input)) return "accept";
  return "reject";
}

async function handle_inspect(data) {
  console.log("Received inspect request data " + JSON.stringify(data));
  const inspect = parseInspect(data);
  if (!inspect) return "reject";
  await handleInspect(inspect)
  return "accept";
}

var handlers = {
  advance_state: handle_advance,
  inspect_state: handle_inspect,
};

var finish = { status: "accept" };

(async () => {
  while (true) {
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
  }
})();
