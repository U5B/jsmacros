"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util/util");
const item = Player.getPlayer().getMainHand().getItemID();
switch (item) {
    case 'minecraft:compass': {
        const coordinates = (0, util_1.getCompass)();
        Chat.log(`Compass: (${coordinates.x}, ${coordinates.y}, ${coordinates.z})`);
        break;
    }
}
