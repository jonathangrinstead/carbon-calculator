"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var require_hosting_json = __commonJS({
  "src/hosting-json.js"(exports, module) {
    async function check(domain, db) {
      if (typeof domain === "string") {
        return checkInJSON(domain, db);
      } else {
        return checkDomainsInJSON(domain, db);
      }
    }
    function checkInJSON(domain, db) {
      if (db.indexOf(domain) > -1) {
        return true;
      }
      return false;
    }
    function greenDomainsFromResults(greenResults) {
      const entries = Object.entries(greenResults);
      const greenEntries = entries.filter(([key, val]) => val.green);
      return greenEntries.map(([key, val]) => val.url);
    }
    function checkDomainsInJSON(domains, db) {
      let greenDomains = [];
      for (let domain of domains) {
        if (db.indexOf(domain) > -1) {
          greenDomains.push(domain);
        }
      }
      return greenDomains;
    }
    function find(domain, db) {
      if (typeof domain === "string") {
        return findInJSON(domain, db);
      } else {
        return findDomainsInJSON(domain, db);
      }
    }
    function findInJSON(domain, db) {
      if (db.indexOf(domain) > -1) {
        return domain;
      }
      return {
        url: domain,
        green: false
      };
    }
    function findDomainsInJSON(domains, db) {
      const result = {};
      for (let domain of domains) {
        result[domain] = findInJSON(domain, db);
      }
      return result;
    }
    module.exports = {
      check,
      greenDomainsFromResults,
      find
    };
  }
});
export default require_hosting_json();
