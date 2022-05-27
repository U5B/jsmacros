"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Line 1: Pineapple
// Line 2: _______________
// Line 3: Buy for 69 ccs
// Line 4: Sell for 42 ccs
// $1 - item name, $2 - buy price, $3 - buy currency, $4 - sell price, $5 - sell currency
const stonkRegex = /(.+) _{15} Buy for ([\d\.]+) ([a-z]{2,3}) Sell for ([\d\.]+) ([a-z]{2,3})/;
const lastStonkCoSign = {
    item: '',
    buy: 0,
    buyCurrency: '',
    sell: 0,
    sellCurrency: ''
};
const region = {
    r1: { hyper: 'hxp', concentrated: 'cxp', standard: 'xp', region: 'r1' },
    r2: { hyper: 'hcs', concentrated: 'ccs', standard: 'cs', region: 'r2' }
};
const currencyMap = {
    hcs: region.r2,
    ccs: region.r2,
    cs: region.r2,
    hxp: region.r1,
    cxp: region.r1,
    xp: region.r1
};
function convertToHyper(price, currency) {
    if (currency === 'cs' || currency === 'xp') {
        price = price / 8;
        price = price / 64;
    }
    else if (currency === 'ccs' || currency === 'cxp')
        price = price / 64;
    return price;
}
function calculateCurrencyColor(currency) {
    const region = currencyMap[currency].region;
    let color = '§r';
    if (region === 'r1')
        color = colors.r1;
    else if (region === 'r2')
        color = colors.r2;
    return color;
}
const colors = {
    buy: '§4',
    sell: '§2',
    item: '§e',
    r1: '§6',
    r2: '§9'
};
function resetSignData() {
    lastStonkCoSign.item = '';
    lastStonkCoSign.buy = 0;
    lastStonkCoSign.buyCurrency = '';
    lastStonkCoSign.sell = 0;
    lastStonkCoSign.sellCurrency = '';
    return true;
}
function checkForStonkCoSign(chat) {
    const message = chat.text.getStringStripFormatting().trim();
    if (!stonkRegex.test(message))
        return false;
    const [, item, buyPrice, buyCurrency, sellPrice, sellCurrency] = stonkRegex.exec(message);
    lastStonkCoSign.item = item;
    lastStonkCoSign.buy = Number(buyPrice);
    lastStonkCoSign.buyCurrency = buyCurrency;
    lastStonkCoSign.sell = Number(sellPrice);
    lastStonkCoSign.sellCurrency = sellCurrency;
    const buyCurrencyColor = calculateCurrencyColor(buyCurrency);
    const sellCurrencyColor = calculateCurrencyColor(sellCurrency);
    Chat.log(`§7[§aUMarket§7]§r StonkCo ${colors.item}'${item}'§r: ${colors.buy}buy:§r ${buyCurrencyColor}${buyPrice}${buyCurrency}§r, ${colors.sell}sell:§r ${sellCurrencyColor}${sellPrice}${sellCurrency}§r`);
    resetSignData();
    return true;
}
function stonkCoCalculator(ctx) {
    if (lastStonkCoSign.item === '')
        return Chat.log('§7[§aUMarket§7]§r No StonkCo sign found. Right-click a StonkCo sign first or use the /umarket calc command.');
    const itemCount = ctx.getArg('item count');
    const buying = ctx.getArg('buy/sell') === 'buy';
    let price = 0;
    let currency = '';
    if (buying) {
        price = lastStonkCoSign.buy;
        currency = lastStonkCoSign.buyCurrency;
    }
    else {
        price = lastStonkCoSign.sell;
        currency = lastStonkCoSign.sellCurrency;
    }
    const output = calculator(price, itemCount, currency);
    Chat.log(`§7[§aUMarket§7]§r ${colors.item}${itemCount}x '${lastStonkCoSign.item}'§r: ${buying ? `${colors.buy}Buy§r` : `${colors.sell}Sell§r`}: ${output.color}(${output.hyper.count}${output.hyper.name}, ${output.concentrated.count}${output.concentrated.name}, ${output.standard.count}${output.standard.name})§r`);
    return true;
}
function regularCalculator(ctx) {
    const itemCount = ctx.getArg('item count');
    const price = ctx.getArg('price');
    const currency = ctx.getArg('currency');
    const output = calculator(price, itemCount, currency);
    Chat.log(`§7[§aUMarket§7]§r ${colors.item}${itemCount}x items§r: ${output.color}(${output.hyper.count}${output.hyper.name}, ${output.concentrated.count}${output.concentrated.name}, ${output.standard.count}${output.standard.name})§r`);
    return true;
}
function calculator(price, item, currency) {
    let totalPrice = price * item;
    totalPrice = convertToHyper(totalPrice, currency);
    let output = { color: calculateCurrencyColor(currency), hyper: { count: 0, name: currencyMap[currency].hyper }, concentrated: { count: 0, name: currencyMap[currency].concentrated }, standard: { count: 0, name: currencyMap[currency].standard } };
    // determine region color (gold for region 1, blue for region 2)
    // determine hyper, concentrated, and standard currency count
    if (totalPrice > 0) { // calculate if greater than 0
        output.hyper.count = Math.floor(totalPrice);
        totalPrice = totalPrice - output.hyper.count;
        if (totalPrice > 0) { // calculate if greater than 0
            output.concentrated.count = Math.floor(totalPrice * 64);
            totalPrice = totalPrice - output.concentrated.count;
            if (totalPrice > 0)
                output.standard.count = Math.floor(totalPrice * 8);
        }
    }
    return output;
}
function help() {
    Chat.log(`§7[§aUMarket§7]§r Help:
/umarket stonk buy/sell <item count>
  for StonkCo signs
/umarket calc <currency> <price> <item count>
  regular calculator`);
    return true;
}
let command;
function commander(stop = false) {
    if (command) {
        command.unregister();
        command = null;
    }
    if (stop === true)
        return true;
    command = Chat.createCommandBuilder('umarket');
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
        .executes(JavaWrapper.methodToJava(help));
    command.register();
}
function start() {
    commander();
    JsMacros.on('RecvMessage', JavaWrapper.methodToJavaAsync(checkForStonkCoSign));
    JsMacros.on('DimensionChange', JavaWrapper.methodToJavaAsync(resetSignData));
}
function terminate() {
    commander(true);
    return true;
}
start();
// @ts-ignore
event.stopListener = JavaWrapper.methodToJava(terminate);
