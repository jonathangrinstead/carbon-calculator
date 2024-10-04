"use strict";
import { getApiRequestHeaders } from "./helpers/index.js";
import hostingJSON from "./hosting-json.js";
function check(domain, optionsOrAgentId) {
  const options = typeof optionsOrAgentId === "string" ? { userAgentIdentifier: optionsOrAgentId } : optionsOrAgentId;
  if ((options == null ? void 0 : options.db) && options.verbose) {
    throw new Error("verbose mode cannot be used with a local lookup database");
  }
  if (typeof domain === "string") {
    return checkAgainstAPI(domain, options);
  } else {
    return checkDomainsAgainstAPI(domain, options);
  }
}
async function checkAgainstAPI(domain, options = {}) {
  const req = await fetch(`https://api.thegreenwebfoundation.org/greencheck/${domain}`, {
    headers: getApiRequestHeaders(options.userAgentIdentifier)
  });
  if (options == null ? void 0 : options.db) {
    return hostingJSON.check(domain, options.db);
  }
  const res = await req.json();
  return options.verbose ? res : res.green;
}
async function checkDomainsAgainstAPI(domains, options = {}) {
  try {
    const apiPath = "https://api.thegreenwebfoundation.org/v2/greencheckmulti";
    const domainsString = JSON.stringify(domains);
    const req = await fetch(`${apiPath}/${domainsString}`, {
      headers: getApiRequestHeaders(options.userAgentIdentifier)
    });
    const allGreenCheckResults = await req.json();
    return options.verbose ? allGreenCheckResults : greenDomainsFromResults(allGreenCheckResults);
  } catch (e) {
    return options.verbose ? {} : [];
  }
}
function greenDomainsFromResults(greenResults) {
  const entries = Object.entries(greenResults);
  const greenEntries = entries.filter(([key, val]) => val.green);
  return greenEntries.map(([key, val]) => val.url);
}
var hosting_api_default = {
  check
};
export {
  hosting_api_default as default
};
