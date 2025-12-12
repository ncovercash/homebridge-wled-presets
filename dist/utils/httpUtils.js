"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpSendData = httpSendData;
exports.loadEffects = loadEffects;
const axios_1 = __importDefault(require("axios"));
function httpSendData(url, method, data, callback) {
    if (method.toLowerCase() === 'post') {
        axios_1.default.post(String(url), data)
            .then(function (response) {
            callback(null, response);
        })
            .catch(function (error) {
            callback(error, null);
        });
    }
    else if (method.toLowerCase() === 'get') {
        axios_1.default.get(url)
            .then(function (response) {
            callback(null, response);
        })
            .catch(function (error) {
            callback(error, null);
        });
    }
}
async function loadEffects(hosts) {
    return new Promise((resolve, reject) => {
        let host;
        if (hosts instanceof Array) {
            host = hosts[0];
        }
        else {
            host = hosts;
        }
        httpSendData(`http://${host}/json/effects`, 'GET', {}, (error, response) => {
            if (error || response === null) {
                reject(new Error(`Error while loading all effects on ${host}`));
                return;
            }
            // eslint-disable-next-line no-console
            console.log(`Loaded all effects for ${host}`);
            resolve(response.data);
        });
    });
}
//# sourceMappingURL=httpUtils.js.map