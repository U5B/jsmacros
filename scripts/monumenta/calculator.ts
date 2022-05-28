// @ts-ignore # figure out if it is a node env
const nodeEnv = (typeof process !== 'undefined') && (process.release.name.search(/node|io.js/) !== -1)
import * as util from '../lib/util'
// Line 1: Pineapple
// Line 2: _______________
// Line 3: Buy for 69 ccs
// Line 4: Sell for 42 ccs
// $1 - item name, $2 - buy price, $3 - buy currency, $4 - sell price, $5 - sell currency
const stonkRegex = /([\w\d\. ]{1,15}) [_]{15} Buy for ([\d\.]+) ([a-z]{2,3}) Sell for ([\d\.]+) ([a-z]{2,3})/
// Line 1: Currency
// Line 2: _______________
// Line 3: 1 hcs → 69 cxp
// Line 4: 1 hxp → 42 ccs
 // $1 - 
const stonkCurrencyRegex = /Currency \d [_~]{15} 1 hcs → ([\d]{2,3}) ([a-z]{3}) 1 hxp → ([\d]{2,3}) ([a-z]{3})/

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
  switch (true) {
    case stonkRegex.test(message): {
      const [, item, buyPrice, buyCurrency, sellPrice, sellCurrency] = stonkRegex.exec(message)
      addStonkCoSign(item, buyPrice, buyCurrency, sellPrice, sellCurrency)
      break
    }
    case stonkCurrencyRegex.test(message): {
      const [, hcsToCurrencyAmount, hcsToCurrency, hxpToCurrencyAmount, hxpToCurrency] = stonkCurrencyRegex.exec(message)
      addStonkCurrencySign('Currency Convert', hcsToCurrencyAmount, hcsToCurrency, hxpToCurrencyAmount, hxpToCurrency)
      break
    }

  }
  return true
}

function addStonkCoSign (item: string, buyPrice: string, buyCurrency: string, sellPrice: string, sellCurrency: string) {
  resetSignData()
  if (item) lastStonkCoSign.item = item
  if (buyPrice) lastStonkCoSign.buy = Number(buyPrice)
  if (buyCurrency) lastStonkCoSign.buyCurrency = buyCurrency
  if (sellPrice) lastStonkCoSign.sell = Number(sellPrice)
  if (sellCurrency) lastStonkCoSign.sellCurrency = sellCurrency
  const buyCurrencyColor = calculateCurrencyColor(buyCurrency)
  const sellCurrencyColor = calculateCurrencyColor(sellCurrency)
  logInfo(`StonkCo ${colors.item}'${item}'§r: ${colors.buy}buy:§r ${buyCurrencyColor}${buyPrice}${buyCurrency}§r, ${colors.sell}sell:§r ${sellCurrencyColor}${sellPrice}${sellCurrency}§r`)
}

function addStonkCurrencySign (item, hcsToCurrencyAmount: string, hcsToCurrency: string, hxpToCurrencyAmount: string, hxpToCurrency: string) {
  if (item) lastStonkCoSign.item = item
  if (hcsToCurrencyAmount) lastStonkCoSign.buy = Number(hcsToCurrencyAmount) // buy is used for hcs -> cxp
  if (hcsToCurrency) lastStonkCoSign.buyCurrency = hcsToCurrency
  if (hxpToCurrencyAmount) lastStonkCoSign.sell = Number(hxpToCurrencyAmount) // sell is used for hxp -> ccs
  if (hxpToCurrency) lastStonkCoSign.sellCurrency = hxpToCurrency
  const cxpCurrencyColor = calculateCurrencyColor(hcsToCurrency)
  const ccsCurrencyColor = calculateCurrencyColor(hxpToCurrency)
  logInfo(`StonkCo ${colors.item}'${item}'§r: ${ccsCurrencyColor}1hcs§r > ${cxpCurrencyColor}${hcsToCurrencyAmount}${hcsToCurrency}§r | ${cxpCurrencyColor}1hxp§r > ${ccsCurrencyColor}${hxpToCurrencyAmount}${hxpToCurrency}§r`)
}

function stonkCoCalculator (ctx) {
  if (lastStonkCoSign.item === '') return Chat.log('§7[§aMMarket§7]§r No StonkCo sign found. Right-click a StonkCo sign first or use the /mmarket calc command.')
  const itemCount = ctx.getArg('item amount')
  const buying = ctx.getArg('buy/sell')
  let price = 0
  let currency = ''
  if (buying === 'buy') {
    if (lastStonkCoSign.buy === 0 || lastStonkCoSign.buyCurrency === '') return logInfo(`No buy price found. Try doing /mmarket stonkco sell <${itemCount} instead.`)
    price = lastStonkCoSign.buy
    currency = lastStonkCoSign.buyCurrency
  } else if (buying === 'sell') {
    if (lastStonkCoSign.sell === 0 || lastStonkCoSign.buyCurrency === '') return logInfo(`No sell price found. Try doing /mmarket stonkco buy <${itemCount} instead.`)
    price = lastStonkCoSign.sell
    currency = lastStonkCoSign.sellCurrency
  } else {
    return logInfo('Invalid argument. Try /mmarket stonkco buy <amount> or /mmarket stonkco sell <amount>')
  }
  if (!itemCount) return logInfo('Invalid item amount: ' + itemCount)
  const output = calculator(price, itemCount, currency)
  logInfo(`${colors.item}${itemCount}x '${lastStonkCoSign.item}'§r: ${colors[buying]}${buying} ${output.color}(${output.hyper.count}${output.hyper.name}, ${output.concentrated.count}${output.concentrated.name}, ${output.standard.count}${output.standard.name})§r`)
  return true
}

function stonkConvertCalculator (ctx) {
  if (lastStonkCoSign.item === '') return Chat.log('§7[§aMMarket§7]§r No StonkCo sign found. Right-click a StonkCo sign first or use the /mmarket calc command.')
  if (lastStonkCoSign.item !== 'Currency Convert') return Chat.log('§7[§aMMarket§7]§r StonkCo Currency sign found. Try /mmarket stonkco buy <amount> or /mmarket stonkco sell <amount>.')
  const hyperAmount = ctx.getArg('hyper amount')
  const currency = ctx.getArg('currency')
  const currencyFrom =  currencyMap[currency].region.hyper
  const currencyFromColor = calculateCurrencyColor(currencyFrom)
  let toCurrency = ''
  let toCurrencyAmount = 0
  if (currencyFrom === 'hcs') {
    toCurrencyAmount = lastStonkCoSign.buy
    toCurrency = lastStonkCoSign.buyCurrency
  } else if (currencyFrom === 'hxp') {
    toCurrencyAmount = lastStonkCoSign.sell
    toCurrency = lastStonkCoSign.sellCurrency
  } else {
    return logInfo('Invalid argument.')
  }
  const output = calculator(toCurrencyAmount, hyperAmount, toCurrency)
  logInfo(`${currencyFromColor}${hyperAmount}${currencyFrom}§r > ${output.color}(${output.hyper.count}${output.hyper.name}, ${output.concentrated.count}${output.concentrated.name}, ${output.standard.count}${output.standard.name})§r`)
  return true
}

function regularCalculator (ctx) {
  const itemCount = ctx.getArg('item amount')
  const price = ctx.getArg('price')
  const currency = ctx.getArg('currency')
  if (!Number.isInteger(itemCount) || Number.isInteger(price) || Number.isInteger(currency)) return logInfo('Invalid arguments...')
  const output = calculator(price, itemCount, currency)
  logInfo(`${colors.item}${itemCount}x items§r: ${output.color}(${output.hyper.count}${output.hyper.name}, ${output.concentrated.count}${output.concentrated.name}, ${output.standard.count}${output.standard.name})§r`)
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
  logInfo(`Usage:
/mmarket buy/sell <amount>
/mmarket convert <currency> <amount>
/mmarket calc <currency> <price> <amount>
/mmarket help
`)
  return true
}

let command
function commander (stop = false) {
  if (command) {
    command.unregister()
    command = null
  }
  if (stop === true) return true
  command = Chat.createCommandBuilder('mmarket')
  command
    .literalArg('stonkco')
      .wordArg('buy/sell').suggestMatching(['buy', 'sell'])
      .intArg('item amount')
      .executes(JavaWrapper.methodToJava(stonkCoCalculator))
    .or(2)
      .literalArg('convert')
      .wordArg('currency').suggestMatching('cxp', 'ccs')
      .intArg('hyper amount')
      .executes(JavaWrapper.methodToJava(stonkConvertCalculator))
  .or(1)
    .literalArg('calc')
    .wordArg('currency').suggestMatching(['hcs', 'ccs', 'cs', 'hxp', 'cxp', 'xp'])
    .intArg('price')
    .intArg('item amount')
    .executes(JavaWrapper.methodToJava(regularCalculator))
  .or(1)
    .literalArg('help')
    .executes(JavaWrapper.methodToJava(help))
  command.register()
}

function start () {
  logInfo('Started! Type /mmarket help for more info.')
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

function logInfo (string, noChat = false) {
  util.logInfo(string, 'MMarket', noChat)
}
export {}