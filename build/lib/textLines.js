"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextLines = void 0;
class TextLines {
    constructor(draw2d, x, y, rightShift = false) {
        /** @type Java.xyz.wagyourtail.jsmacros.client.api.classes.Draw2D */
        this.draw2d = draw2d;
        /** @type  Java.xyz.wagyourtail.jsmacros.client.api.sharedclasses.RenderCommon$Text[] */
        this._lines = [];
        this.x = x;
        this.y = y;
        this.rightShift = rightShift;
    }
    get lines() {
        this._lines.map(text => text.getText());
    }
    set lines(lines) {
        // ensure enough text lines
        for (let i = this._lines.length; i < lines.length; i++) {
            let xPos = this.x;
            let yPos = this.y + 12 * i;
            let txt = this.draw2d.addText('', xPos, yPos, 0xffffff, true);
            if (this.rightShift)
                txt.setPos(this.x - txt.width, this.y + 12 * i);
            this._lines.push(txt);
        }
        // Delete extras
        this._lines.slice(lines.length).forEach(l => {
            this.draw2d.removeText(l);
        });
        this._lines = this._lines.slice(0, lines.length);
        // Populate with data
        lines.forEach((txt, i) => {
            this._lines[i].setText(txt);
        });
    }
}
exports.TextLines = TextLines;
