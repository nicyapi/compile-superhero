"use strict";
exports.__esModule = true;
var https_1 = require("https");
https_1.get('https://wscats.gallery.vsassets.io/_apis/public/gallery/publisher/Wscats/extension/qf/6.7.1/assetbyname/Microsoft.VisualStudio.Services.VSIXPackage?redirect=true&install=true', {
    headers: {
        // ":method": "GET",
        // ":authority": "wscats.gallery.vsassets.io",
        // ":scheme": "https",
        // ":path": "/_apis/public/gallery/publisher/Wscats/extension/qf/6.7.1/assetbyname/Microsoft.VisualStudio.Services.VSIXPackage?redirect=true&install=true",
        "accept": "*/*",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "zh-CN",
        "cookie": "EnableExternalSearchForVSCode=true",
        "user-agent": "VSCode 1.39.2",
        "x-market-client-id": "VSCode 1.39.2",
        "x-market-user-id": "f2500034-c981-4f54-bcdb-45bbf63994b3"
    }
}, function (res) {
    // console.log(res)
});