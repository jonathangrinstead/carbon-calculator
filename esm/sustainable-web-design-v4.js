"use strict";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
import { fileSize, SWDV4 } from "./constants/index.js";
import { outputRating } from "./helpers/index.js";
const {
  OPERATIONAL_KWH_PER_GB_DATACENTER,
  OPERATIONAL_KWH_PER_GB_NETWORK,
  OPERATIONAL_KWH_PER_GB_DEVICE,
  EMBODIED_KWH_PER_GB_DATACENTER,
  EMBODIED_KWH_PER_GB_NETWORK,
  EMBODIED_KWH_PER_GB_DEVICE,
  GLOBAL_GRID_INTENSITY
} = SWDV4;
function outputSegments(operationalEmissions, embodiedEmissions) {
  const totalOperationalCO2e = operationalEmissions.dataCenter + operationalEmissions.network + operationalEmissions.device;
  const totalEmbodiedCO2e = embodiedEmissions.dataCenter + embodiedEmissions.network + embodiedEmissions.device;
  const dataCenterCO2e = operationalEmissions.dataCenter + embodiedEmissions.dataCenter;
  const networkCO2e = operationalEmissions.network + embodiedEmissions.network;
  const consumerDeviceCO2e = operationalEmissions.device + embodiedEmissions.device;
  return {
    dataCenterOperationalCO2e: operationalEmissions.dataCenter,
    networkOperationalCO2e: operationalEmissions.network,
    consumerDeviceOperationalCO2e: operationalEmissions.device,
    dataCenterEmbodiedCO2e: embodiedEmissions.dataCenter,
    networkEmbodiedCO2e: embodiedEmissions.network,
    consumerDeviceEmbodiedCO2e: embodiedEmissions.device,
    totalEmbodiedCO2e,
    totalOperationalCO2e,
    dataCenterCO2e,
    networkCO2e,
    consumerDeviceCO2e
  };
}
function getGreenHostingFactor(green, options) {
  if (green) {
    return 1;
  } else if ((options == null ? void 0 : options.greenHostingFactor) || (options == null ? void 0 : options.greenHostingFactor) === 0) {
    return options.greenHostingFactor;
  }
  return 0;
}
class SustainableWebDesign {
  constructor(options) {
    this.allowRatings = true;
    this.options = options;
    this.version = 4;
  }
  operationalEnergyPerSegment(bytes) {
    const transferedBytesToGb = bytes / fileSize.GIGABYTE;
    const dataCenter = transferedBytesToGb * OPERATIONAL_KWH_PER_GB_DATACENTER;
    const network = transferedBytesToGb * OPERATIONAL_KWH_PER_GB_NETWORK;
    const device = transferedBytesToGb * OPERATIONAL_KWH_PER_GB_DEVICE;
    return {
      dataCenter,
      network,
      device
    };
  }
  operationalEmissions(bytes, options = {}) {
    const { dataCenter, network, device } = this.operationalEnergyPerSegment(bytes);
    let dataCenterGridIntensity = GLOBAL_GRID_INTENSITY;
    let networkGridIntensity = GLOBAL_GRID_INTENSITY;
    let deviceGridIntensity = GLOBAL_GRID_INTENSITY;
    if (options == null ? void 0 : options.gridIntensity) {
      const { device: device2, network: network2, dataCenter: dataCenter2 } = options.gridIntensity;
      if ((device2 == null ? void 0 : device2.value) || (device2 == null ? void 0 : device2.value) === 0) {
        deviceGridIntensity = device2.value;
      }
      if ((network2 == null ? void 0 : network2.value) || (network2 == null ? void 0 : network2.value) === 0) {
        networkGridIntensity = network2.value;
      }
      if ((dataCenter2 == null ? void 0 : dataCenter2.value) || (dataCenter2 == null ? void 0 : dataCenter2.value) === 0) {
        dataCenterGridIntensity = dataCenter2.value;
      }
    }
    const dataCenterEmissions = dataCenter * dataCenterGridIntensity;
    const networkEmissions = network * networkGridIntensity;
    const deviceEmissions = device * deviceGridIntensity;
    return {
      dataCenter: dataCenterEmissions,
      network: networkEmissions,
      device: deviceEmissions
    };
  }
  embodiedEnergyPerSegment(bytes) {
    const transferedBytesToGb = bytes / fileSize.GIGABYTE;
    const dataCenter = transferedBytesToGb * EMBODIED_KWH_PER_GB_DATACENTER;
    const network = transferedBytesToGb * EMBODIED_KWH_PER_GB_NETWORK;
    const device = transferedBytesToGb * EMBODIED_KWH_PER_GB_DEVICE;
    return {
      dataCenter,
      network,
      device
    };
  }
  embodiedEmissions(bytes) {
    const { dataCenter, network, device } = this.embodiedEnergyPerSegment(bytes);
    const dataCenterGridIntensity = GLOBAL_GRID_INTENSITY;
    const networkGridIntensity = GLOBAL_GRID_INTENSITY;
    const deviceGridIntensity = GLOBAL_GRID_INTENSITY;
    const dataCenterEmissions = dataCenter * dataCenterGridIntensity;
    const networkEmissions = network * networkGridIntensity;
    const deviceEmissions = device * deviceGridIntensity;
    return {
      dataCenter: dataCenterEmissions,
      network: networkEmissions,
      device: deviceEmissions
    };
  }
  perByte(bytes, green = false, segmented = false, ratingResults = false, options = {}) {
    if (bytes < 1) {
      return 0;
    }
    const operationalEmissions = this.operationalEmissions(bytes, options);
    const embodiedEmissions = this.embodiedEmissions(bytes);
    const greenHostingFactor = getGreenHostingFactor(green, options);
    const totalEmissions = {
      dataCenter: operationalEmissions.dataCenter * (1 - greenHostingFactor) + embodiedEmissions.dataCenter,
      network: operationalEmissions.network + embodiedEmissions.network,
      device: operationalEmissions.device + embodiedEmissions.device
    };
    const total = totalEmissions.dataCenter + totalEmissions.network + totalEmissions.device;
    let rating = null;
    if (ratingResults) {
      rating = this.ratingScale(total);
    }
    if (segmented) {
      const segments = __spreadValues({}, outputSegments(operationalEmissions, embodiedEmissions));
      if (ratingResults) {
        return __spreadProps(__spreadValues({}, segments), {
          total,
          rating
        });
      }
      return __spreadProps(__spreadValues({}, segments), { total });
    }
    if (ratingResults) {
      return { total, rating };
    }
    return total;
  }
  perVisit(bytes, green = false, segmented = false, ratingResults = false, options = {}) {
    let firstViewRatio = 1;
    let returnViewRatio = 0;
    let dataReloadRatio = 0;
    const greenHostingFactor = getGreenHostingFactor(green, options);
    const operationalEmissions = this.operationalEmissions(bytes, options);
    const embodiedEmissions = this.embodiedEmissions(bytes);
    if (bytes < 1) {
      return 0;
    }
    if (options.firstVisitPercentage || options.firstVisitPercentage === 0) {
      firstViewRatio = options.firstVisitPercentage;
    }
    if (options.returnVisitPercentage || options.returnVisitPercentage === 0) {
      returnViewRatio = options.returnVisitPercentage;
    }
    if (options.dataReloadRatio || options.dataReloadRatio === 0) {
      dataReloadRatio = options.dataReloadRatio;
    }
    const firstVisitEmissions = operationalEmissions.dataCenter * (1 - greenHostingFactor) + embodiedEmissions.dataCenter + operationalEmissions.network + embodiedEmissions.network + operationalEmissions.device + embodiedEmissions.device;
    const returnVisitEmissions = (operationalEmissions.dataCenter * (1 - greenHostingFactor) + embodiedEmissions.dataCenter + operationalEmissions.network + embodiedEmissions.network + operationalEmissions.device + embodiedEmissions.device) * (1 - dataReloadRatio);
    const total = firstVisitEmissions * firstViewRatio + returnVisitEmissions * returnViewRatio;
    let rating = null;
    if (ratingResults) {
      rating = this.ratingScale(total);
    }
    if (segmented) {
      const segments = __spreadProps(__spreadValues({}, outputSegments(operationalEmissions, embodiedEmissions)), {
        firstVisitCO2e: firstVisitEmissions,
        returnVisitCO2e: returnVisitEmissions
      });
      if (ratingResults) {
        return __spreadProps(__spreadValues({}, segments), {
          total,
          rating
        });
      }
      return __spreadProps(__spreadValues({}, segments), { total });
    }
    if (ratingResults) {
      return { total, rating };
    }
    return total;
  }
  ratingScale(co2e) {
    return outputRating(co2e, this.version);
  }
}
var sustainable_web_design_v4_default = SustainableWebDesign;
export {
  SustainableWebDesign,
  sustainable_web_design_v4_default as default
};
