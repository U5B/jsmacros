class TextLines {
  constructor (draw2d, x, y) {
    /** @type Draw2D */
    this.draw2d = draw2d
    /** @type  Java.xyz.wagyourtail.jsmacros.client.api.sharedclasses.RenderCommon$Text[] */
    this._lines = []
    this.x = x
    this.y = y
  }

  get lines () {
    this._lines.map(text => text.getText())
  }

  set lines (lines) {
    // ensure enough text lines
    for (let i = this._lines.length; i < lines.length; i++) {
      this._lines.push(this.draw2d.addText('', this.x, this.y + 12 * i, 0xffffff, true))
    }
    // Delete extras
    this._lines.slice(lines.length).forEach(l => {
      this.draw2d.removeText(l)
    })
    this._lines = this._lines.slice(0, lines.length)
    // Populate with data
    lines.forEach((txt, i) => {
      this._lines[i].setText(txt)
    })
  }
}
export { TextLines }
