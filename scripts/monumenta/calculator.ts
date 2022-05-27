// @ts-ignore # figure out if it is a node env
const nodeEnv = (typeof process !== 'undefined') && (process.release.name.search(/node|io.js/) !== -1)
// Line 1: Pineapple
// Line 2: _______________
// Line 3: Buy for 69 ccs
// Line 4: Sell for 42 ccs
// $1 - item name, $2 - buy price, $3 - buy currency, $4 - sell price, $5 - sell currency
const stonkRegex = /(.+) _{15} Buy for ([\d\.]+) ([a-z]{2,3}) Sell for ([\d\.]+) ([a-z]{2,3})/
const lastStonkCoSign = {
  item: '',
  buy: 0,
  buyCurrency: '',
  sell: 0,
  sellCurrency: ''
}

const region = {
  r1: { hyper: 'hxp', concentrated: 'cxp', standard: 'xp', region: 'r1' },
  r2: { hyper: 'hcs', concentrated: 'ccs', standard: 'cs', region: 'r2'}
}
const currencyMap = {
  hcs: { type: 'hyper', region: region.r2 },
  ccs: { type: 'concentrated', region: region.r2 },
  cs: { type: 'standard', region: region.r2 },
  hxp: { type: 'hyper', region: region.r1 },
  cxp: { type: 'concentrated', region: region.r1 },
  xp: { type: 'standard', region: region.r1 },
}
const conversion = {
  hyper: {
    up: 1,
    down: 64,
    child: 'concentrated'
  },
  concentrated: {
    up: 64,
    down: 8,
    child: 'standard'
  },
  standard: {
    up: 8,
    down: 1,
    child: ''
  }
}

function convertToHyper (price: number, currency: string) {
  if (currencyMap[currency].type === 'standard') {
    price = price / conversion['standard'].up
    price = price / conversion['concentrated'].up
  } 
  else if (currencyMap[currency].type === 'concentrated') price = price / conversion['concentrated'].up
  return price
}

function calculateCurrencyColor (currency) {
  const region = currencyMap[currency].region.region
  let color = '§r'
  if (region === 'r1') color = colors.r1
  else if (region === 'r2') color = colors.r2
  return color
}
const colors = {
  buy: '§4',
  sell: '§2',
  item: '§e',
  r1: '§6',
  r2: '§9'
}

function resetSignData () {
  lastStonkCoSign.item = ''
  lastStonkCoSign.buy = 0
  lastStonkCoSign.buyCurrency = ''
  lastStonkCoSign.sell = 0
  lastStonkCoSign.sellCurrency = ''
  return true
}
function checkForStonkCoSign (chat: Events.RecvMessage) {
  const message = chat.text.getStringStripFormatting().trim()
  if (!stonkRegex.test(message)) return false
  const [, item, buyPrice, buyCurrency, sellPrice, sellCurrency] = stonkRegex.exec(message)
  lastStonkCoSign.item = item
  lastStonkCoSign.buy = Number(buyPrice)
  lastStonkCoSign.buyCurrency = buyCurrency
  lastStonkCoSign.sell = Number(sellPrice)
  lastStonkCoSign.sellCurrency = sellCurrency
  const buyCurrencyColor = calculateCurrencyColor(buyCurrency)
  const sellCurrencyColor = calculateCurrencyColor(sellCurrency)
  Chat.log(`§7[§aUMarket§7]§r StonkCo ${colors.item}'${item}'§r: ${colors.buy}buy:§r ${buyCurrencyColor}${buyPrice}${buyCurrency}§r, ${colors.sell}sell:§r ${sellCurrencyColor}${sellPrice}${sellCurrency}§r`)
  resetSignData() 
  return true
}

function stonkCoCalculator (ctx) {
  if (lastStonkCoSign.item === '') return Chat.log('§7[§aUMarket§7]§r No StonkCo sign found. Right-click a StonkCo sign first or use the /umarket calc command.')
  const itemCount = ctx.getArg('item count')
  const buying = ctx.getArg('buy/sell') === 'buy'
  let price = 0
  let currency = ''
  if (buying) {
    price = lastStonkCoSign.buy
    currency = lastStonkCoSign.buyCurrency
  } else {
    price = lastStonkCoSign.sell
    currency = lastStonkCoSign.sellCurrency
  }
  const output = calculator(price, itemCount, currency)
  Chat.log(`§7[§aUMarket§7]§r ${colors.item}${itemCount}x '${lastStonkCoSign.item}'§r: ${buying ? `${colors.buy}Buy§r` : `${colors.sell}Sell§r`}: ${output.color}(${output.hyper.count}${output.hyper.name}, ${output.concentrated.count}${output.concentrated.name}, ${output.standard.count}${output.standard.name})§r`)
  return true
}

function regularCalculator (ctx) {
  const itemCount = ctx.getArg('item count')
  const price = ctx.getArg('price')
  const currency = ctx.getArg('currency')
  const output = calculator(price, itemCount, currency)
  Chat.log(`§7[§aUMarket§7]§r ${colors.item}${itemCount}x items§r: ${output.color}(${output.hyper.count}${output.hyper.name}, ${output.concentrated.count}${output.concentrated.name}, ${output.standard.count}${output.standard.name})§r`)
  return true
}

function calculator (price: number, itemCount: number, currency: string) { // pain I hardcoded the multiplier
  let total = price * itemCount
  let output = { color : calculateCurrencyColor(currency), hyper: { count: 0, name: currencyMap[currency].region.hyper }, concentrated: { count: 0, name: currencyMap[currency].region.concentrated }, standard: { count: 0, name: currencyMap[currency].region.standard } }
  // determine region color (gold for region 1, blue for region 2)
  // determine hyper, concentrated, and standard currency count
  const hyperTotal = convertToHyper(total, currency)
  currencyObject = { hyper: 0, concentrated: 0, standard: 0 }
  const count = calculateCurrency(hyperTotal, 'hyper', 1)
  output.hyper.count = count.hyper
  output.concentrated.count = count.concentrated
  output.standard.count = count.standard
  /*
  if (total > 0) { // calculate if greater than 0
    output.hyper.count = Math.floor(total)
    total = total - output.hyper.count
    if (total > 0) { // calculate if greater than 0
      output.concentrated.count = Math.floor(total * conversion['concentrated'].down)
      total = total - output.concentrated.count
      if (total > 0) output.standard.count = Math.floor(total * conversion['standard'].down)
    }
  }
  */
  return output
}
let currencyObject = { hyper: 0, concentrated: 0, standard: 0 }
function calculateCurrency (total: number, currency: string, multiplier: number) {
  const count = Math.floor(total * multiplier)
  currencyObject[currency] = count
  total = total - count
  if (total > 0) currencyObject = calculateCurrency(total, conversion[currency].child, conversion[currency].down)
  return currencyObject
}

function help () {
  Chat.log(`§7[§aUMarket§7]§r Help:
/umarket stonk buy/sell <item count>
  for StonkCo signs
/umarket calc <currency> <price> <item count>
  regular calculator`)
  return true
}

let command
function commander (stop = false) {
  if (command) {
    command.unregister()
    command = null
  }
  if (stop === true) return true
  command = Chat.createCommandBuilder('umarket')
  command
    .literalArg('stonk')
    .wordArg('buy/sell').suggestMatching(['buy', 'sell'])
    .intArg('item count')
    .executes(JavaWrapper.methodToJava(stonkCoCalculator))
  .or(1)
    .literalArg('calc')
    .wordArg('currency').suggestMatching(['hcs', 'ccs', 'cs', 'hxp', 'cxp', 'xp'])
    .intArg('price')
    .intArg('item count')
    .executes(JavaWrapper.methodToJava(regularCalculator))
  .or(1)
    .literalArg('help')
    .executes(JavaWrapper.methodToJava(help))
  command.register()
}

function start () {
  commander()
  JsMacros.on('RecvMessage', JavaWrapper.methodToJavaAsync(checkForStonkCoSign))
  JsMacros.on('DimensionChange', JavaWrapper.methodToJavaAsync(resetSignData))
}

function terminate () {
  commander(true)
  return true
}

if (!nodeEnv) {
  start()
  // @ts-ignore
  event.stopListener = JavaWrapper.methodToJava(terminate)
} else {
  const test = calculator(33, 2, 'ccs')
  // @ts-ignore
  console.log(test)
}

export {}