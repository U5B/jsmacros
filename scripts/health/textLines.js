const getAlignCapable = (txt) => {
  let align = 0
  let x = txt.x

  const realign = () => {
    const w = txt.getWidth()
    txt.x = x - align*w*txt.scale
  }
  return new Proxy (txt, {
    set (target, p, value, reciever) {
      if (p === 'align') {
        align = value
        return
      }
      if (p === 'x') x = value
      target[p] = value
      if (align !== 0) realign()
    },
    get (target, p , reciever) {
      switch (p) {
        case 'setText': {
          return (params) => {
            target.setText(params)
            realign()
          }
        }
        case 'setPos': {
          return (nx, ny) => {
            x = nx
            txt.setPos(nx, ny)
            realign()
          }
        }
        case 'setScale': {
          return (scale) => {
            txt.setScale(scale)
            realign()
          }
        }
        default: {
          return target[p]
        }
      }
    }  
  })
}

class TextLines {
  constructor (draw2d, x, y, align = 0) {
    /** @type Java.xyz.wagyourtail.jsmacros.client.api.classes.Draw2D */
    this.draw2d = draw2d
    /** @type Java.xyz.wagyourtail.jsmacros.client.api.sharedclasses.RenderCommon$Text[] */
    this._lines = []
    /** @type Number */
    this.x = x
    /** @type Number */
    this.y = y
    /** @type Number */
    this.align = align // 0 = left, 0.5 = middle, 1 = right
  }

  get lines () {
    this._lines.map(text => text.getText())
  }

  set lines (lines) {
    // ensure enough text lines
    for (let i = this._lines.length; i < lines.length; i++) {
      this._lines.push(getAlignCapable(this.draw2d.addText('', this.x, this.y + 12 * i, 0xffffff, true)))
    }
    // Delete extras
    this._lines.slice(lines.length).forEach(l => {
      this.draw2d.removeText(l)
    })
    this._lines = this._lines.slice(0, lines.length)
    // Populate with data
    lines.forEach((txt, i) => {
      this._lines[i].align =  align // set align here
      this._lines[i].setText(txt)
    })
  }
}

export { TextLines, getAlignCapable }
