import { defineConfig, presetAttributify } from "unocss";

import { presetApplet, presetRemRpx, transformerAttributify } from "unocss-applet";

// uni-app，mp-开头的平台为小程序
const isApplet = process.env?.UNI_PLATFORM?.startsWith("mp-") ?? false;

const presets: any[] = [];
const transformers: any[] = [];

if (isApplet) {
    presets.push(presetApplet());
    presets.push(presetRemRpx({ mode: "rem2rpx", baseFontSize: 2 }));
    transformers.push(transformerAttributify({ ignoreAttributes: ["block"] }));
} else {
    presets.push(presetApplet());
    presets.push(presetAttributify());

    presets.push(presetRemRpx({ mode: "rem2rpx", baseFontSize: 2 }));
}

export default defineConfig({
    presets: [
        // ...
        ...presets,
    ],
    rules: [
        ["b-r-14", { "border-radius": "14rpx" }],
        ["b-r-16", { "border-radius": "16rpx" }],
        ["b-r-8", { "border-radius": "8rpx" }],
        ["b-r-10", { "border-radius": "10rpx" }],
        ["b-r-60", { "border-radius": "60rpx" }],
    ],
    transformers: [
        // ...
        ...transformers,
    ],
    shortcuts: {
        "row-center": "flex flex-row items-center  justify-center",
        "col-center": "flex flex-col items-center justify-center",
        "row-between": "flex  items-center  justify-between",
    },
});
