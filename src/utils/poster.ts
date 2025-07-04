// #ifdef MP
//@ts-ignore
import { Leafer, Rect, type ILeaferConfig, Image, ImageEvent, Group, useCanvas, Text, Box, PointerEvent, type ILeaferImage, LeaferEvent } from "@leafer-ui/miniapp";
// #endif
// #ifdef H5
//@ts-ignore
import { Leafer, Rect, type ILeaferConfig, Image, ImageEvent, Group, Text, Box, PointerEvent, type ILeaferImage, LeaferEvent } from "leafer-ui";
// #endif
import "@leafer-in/export";
// #ifdef MP
useCanvas("canvas", uni);
// #endif

interface IPonter {
    config: ILeaferConfig;
}

export class Poster {
    leafer: Leafer;
    config: ILeaferConfig;
    constructor(options: IPonter) {
        this.config = options.config;
        this.leafer = new Leafer(this.config);
        console.log(LeaferEvent, "LeaferEvent");
    }
    addRect() {
        const rect = new Rect({
            x: 100,
            y: 100,
            width: 100,
            height: 100,
            fill: "#32cd79",
            draggable: true,
        });

        this.leafer.add(rect);
    }
}

interface IDataOptions {
    background: ILeaferImage;
    avatar?: string;
    name?: string;
    qrcode?: string;
    sn: string;
}

interface IOptions {
    config: ILeaferConfig;
    datas: IDataOptions;
}
//生成分销商海报
export class DistPoster extends Poster {
    group: Box;
    datas: IDataOptions;
    constructor(options: IOptions) {
        super(options);
        this.datas = options.datas;
        this.group = new Box({
            width: this.leafer.width,
            height: 160,
            y: 350,
            // fill: "red",
            cornerRadius: 15,
        });
        this.init();
    }
    init() {
        this.leafer.on(LeaferEvent.READY, () => {
            this.addBackground();
            this.addAvatar();
            this.leafer.add(this.group);
        });

        // this.addSubmit();
    }
    addBackground() {
        const { datas } = this;
        const { background } = datas;

        const { width } = this.leafer;

        if (background) {
            const image = new Image({
                url: background.url,

                width: width,
            });

            this.leafer.add(image);
        }
    }
    addAvatar() {
        const { datas, group } = this;
        const { avatar, name, sn, qrcode } = datas;
        const { width, height } = this.leafer;
        if (!width || !height) return;
        const offsetX = 10;
        const offsetY = 20;
        const rect = new Rect({
            width: 40,
            height: 40,
            cornerRadius: 20,
            fill: {
                type: "image",
                url: avatar ?? "",
            },
            y: offsetY,
            x: offsetX,
        });
        const text = new Text({
            text: name,
            y: offsetY + 10,
            x: offsetX + 50,
            fontWeight: "bold",
            fontSize: 14,
        });
        const text1 = new Text({
            text: `邀请您来一起赚大钱`,
            y: offsetY + 50,
            x: offsetX + 10,
            fontSize: 14,
            fill: "red",
        });
        const text2 = new Text({
            text: `邀请码：${sn}`,
            y: offsetY + 75,
            x: offsetX + 10,
            fontSize: 14,
        });

        if (qrcode) {
            const url = `data:image/png;base64,${qrcode}`;

            const rect1 = new Rect({
                width: 100,
                height: 100,
                cornerRadius: 50,
                fill: {
                    type: "image",
                    url,
                },
                y: offsetY,
                x: width - 120,
            });
            group.add(rect1);
        }

        group.addMany(rect, text, text1, text2);
    }

    addSubmit() {
        const info = uni.getWindowInfo();
        const { screenWidth, screenHeight } = info;
        const width = screenWidth - 40;
        const box = new Box({
            x: 20,
            y: screenHeight - 100,
            width: screenWidth - 40,
            height: 40,
            cornerRadius: 30,
            fill: {
                type: "linear",
                opacity: 1,
                from: "left",
                to: "right",
                stops: [
                    { offset: 0, color: "#ff2c3c" },
                    { offset: 1, color: "#ff316a" },
                ],
            },
            children: [
                {
                    tag: "Text",
                    text: "长按保存到相册",
                    fill: "#fff",
                    padding: [8, width / 3],
                    fontSize: 16,
                    // textAlign: "center",
                    // verticalAlign: "middle",
                },
            ],
        });

        this.group.add(box);
        box.on(PointerEvent.LONG_TAP, async () => {
            const result = await this.leafer.export(".png");
            console.log(result, "result");
            console.log("tap");
        });
    }
}

//创建商品分享海报

interface IGoodsData {
    avatar: string;
    image: string;
    price: number;
    oldPrice: number;
    title: string;
}

interface IGoodsOptions extends IPonter {
    data: IGoodsData;
}
export class GoogsPoster extends Poster {
    data: IGoodsData;
    constructor(options: IGoodsOptions) {
        const { data } = options;
        super(options);
        this.data = options.data;
    }
}
