"use strict";
import hostingAPI from "./hosting-api.js";
function check(domain, optionsOrAgentId) {
  return hostingAPI.check(domain, optionsOrAgentId);
}
var hosting_default = check;
export {
  hosting_default as default
};
