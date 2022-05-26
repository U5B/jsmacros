"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextLines = void 0;
const realign = (text, x, align) => {
    let scale = text.scale ?? 1;
    let w;
    try {
        w = text?.getWidth();
    }
    catch {
        w = text.length;
    }
    const xValue = x - align * w * scale;
    return xValue;
};
class TextLines {
    constructor(draw2d, x, y, align = 0) {
        /** @type Java.xyz.wagyourtail.jsmacros.client.api.classes.Draw2D */
        this.draw2d = draw2d;
        /** @type Java.xyz.wagyourtail.jsmacros.client.api.sharedclasses.RenderCommon$Text[] */
        this._lines = [];
        /** @type Number */
        this.x = x;
        /** @type Number */
        this.y = y;
        /** @type Number */
        this.align = align; // 0 = left, 0.5 = middle, 1 = right
    }
    get lines() {
        this._lines.map(text => text.getText());
    }
    set lines(lines) {
        // ensure enough text lines
        for (let i = this._lines.length; i < lines.length; i++) {
            let raw = this.draw2d.addText('', this.x, this.y + 12 * i, 0xffffff, true);
            this._lines.push(raw);
        }
        // Delete extras
        this._lines.slice(lines.length).forEach(l => {
            this.draw2d.removeText(l);
        });
        this._lines = this._lines.slice(0, lines.length);
        // Populate with data
        lines.forEach((txt, i) => {
            const newX = realign(this._lines[i], this.x, this.align);
            this._lines[i].setPos(newX, this.y + 12 * i);
            this._lines[i].setText(txt);
        });
    }
}
exports.TextLines = TextLines;
