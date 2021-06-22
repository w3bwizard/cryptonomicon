// validation scheme
// - validate by uniq in tickerList
    // - valid 
        // - validate by coin list
            // - valid
                // - validate by subscribe to usd
                    // - valid
                        // - subscribe to usd
                    // - invalid 
                        // - validate by subscribe to btc
                            // - valid 
                                // - subscribe to btc
                            // - invalid
                                // - set invalid status
            // - invalid 
                // - set invalid status
    // - invalid 
        // - refuce from add

// Проблемы автодополнения
// - При добавлени невалидного тикера, вебсокет сходит с ума
// - Невалидные тикеры не удаляются
// - Если начать печатать сразу после загрузки страницы, список монет не успевает загрузится
//   и автодополнение не срабатывает
// - Нужно научится пользоватся scync aweit

const API_KEY = '74eea2552d64bb162020979867150f7c48bd83b30c10b95afae842e42ae12384'
const tickersHandlersUSD = new Map()
const tickersHandlersBTC = new Map()
const socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`);
const coinList = []

socket.onopen = function() {
    sendToWS(
        {
        action: 'SubAdd',
        subs: ['5~CCCAGG~BTC~USD']
        }
    )
}

socket.onmessage = function(event) {
    let message = JSON.parse(event.data)
    
    if (message.TYPE === '5' 
        && tickersHandlersUSD.has(message.FROMSYMBOL) 
        && message.TOSYMBOL === 'USD'
        && message.FLAGS != '4') {
        const handler = tickersHandlersUSD.get(message.FROMSYMBOL)
        handler(message.FROMSYMBOL, message.PRICE)
    }
    if (message.TYPE === '5' 
        && message.FROMSYMBOL === 'BTC') {
        socket.BtcPrice = message.PRICE
    }
    if (message.TYPE === '500' 
        && message.MESSAGE === 'INVALID_SUB') {
        subscribeToTickerByBTC(message.PARAMETER, socket.TickerListUpdater)
        console.log(message.PARAMETER)
    }
    if (message.TYPE === '5' 
        && tickersHandlersBTC.has(message.FROMSYMBOL)
        && message.TOSYMBOL === 'BTC') {
        const handler = tickersHandlersBTC.get(message.FROMSYMBOL)
        handler(message.FROMSYMBOL, GetPriceInUSDFromBTC(message.PRICE))
        // console.log(message.FROMSYMBOL, message.PRICE)
    }
}

function sendToWS(msg){
    const stringifiedMsg = JSON.stringify(msg)

    if (socket.readyState === WebSocket.OPEN) {
        socket.send(stringifiedMsg);
        return;
      }
    
      socket.addEventListener(
        "open",
        () => {
          socket.send(stringifiedMsg);
        },
        { once: true }
      );
        
}

function GetPriceInUSDFromBTC(priceInBTC) {
    console.log('socket.BtcPrices', socket.BtcPrices)
    const USD_IN_BTC = 1 / socket.BtcPrices
    // return  (USD_IN_BTC * priceInBTC).toPrecision(3)
    return  (USD_IN_BTC * priceInBTC)
}

function getCoinNameFromParameter(parameter) {
    // console.log(parameter)
    // console.log('5~CCCAGG~', parameter.indexOf('5~CCCAGG~')+ '5~CCCAGG~'.length)
    console.log('~USD', parameter.indexOf('~USD'))
    console.log('check', parameter.indexOf('5~CCCAGG~') != -1 &&  parameter.indexOf('~USD') != -1)
    // console.log('coin_name', parameter.slice(parameter.indexOf('5~CCCAGG~')+ '5~CCCAGG~'.length, parameter.indexOf('~USD')))
    if (parameter.indexOf('5~CCCAGG~') != -1 && parameter.indexOf('~USD') != -1  ) {
        const FROM_INDEX = parameter.indexOf('5~CCCAGG~') + '5~CCCAGG~'.length
        // console.log('FROM_INDEX', FROM_INDEX)
        const TO_INDEX = parameter.indexOf('~USD')
        // console.log('TO_INDEX', TO_INDEX)
        const COIN_NAME = parameter.slice(FROM_INDEX, TO_INDEX)
        // console.log('COIN_NAME', COIN_NAME)
        return COIN_NAME
    } else {
        return null
    }
}

function subscribeToTickerOnWSByBTC(tickerName){
    console.log('subscribeToTickerOnWSByBTC', tickerName)
    sendToWS(
        {
        action: 'SubAdd',
        subs: [`5~CCCAGG~${tickerName}~BTC`]
        }
    )
}

function unsubscribeFromTickerOnWSByBTC(tickerName){
    sendToWS(
        {
        action: 'SubRemove',
        subs: [`5~CCCAGG~${tickerName}~BTC`]
        }
    )
}

function subscribeToTickerOnWS(tickerName){
    sendToWS(
        {
        action: 'SubAdd',
        subs: [`5~CCCAGG~${tickerName}~USD`]
        }
    )
}

function unsubscribeFromTickerOnWS(tickerName){
    sendToWS(
        {
        action: 'SubRemove',
        subs: [`5~CCCAGG~${tickerName}~USD`]
        }
    )
}

function subscribeToTickerByBTC(parameter, cb) {
    const TICKER_NAME = getCoinNameFromParameter(parameter)
    console.log('TICKER_NAME', TICKER_NAME)
    if (TICKER_NAME) {
        tickersHandlersBTC.set(TICKER_NAME, cb)
        subscribeToTickerOnWSByBTC(TICKER_NAME)
    }
}

export function subscribeToTicker(tickerName, cb) {
    socket.TickerListUpdater = cb
    tickersHandlersUSD.set(tickerName, cb)
    subscribeToTickerOnWS(tickerName)
}

export function unsubscribeFromTicker(tickerName) {
    if (tickersHandlersUSD.has(tickerName)) {
        tickersHandlersUSD.delete(tickerName)
        unsubscribeFromTickerOnWS(tickerName)    
    }
    if (tickersHandlersBTC.has(tickerName)) {
        tickersHandlersBTC.delete(tickerName)
        unsubscribeFromTickerOnWSByBTC(tickerName)
    }
}

export function close () {
    socket.close()
}

export function getCoinList() {
    fetch('https://min-api.cryptocompare.com/data/all/coinlist')
    .then((response) => {
    return response.json();
    })
    .then((data) => {
    if (data) {
        coinList.slice(0, coinList.length)
        for (let item in data.Data) {
            let newCoin = {
            name: data.Data[item].FullName,
            symbol: data.Data[item].Symbol
            }
            coinList.push(newCoin)
        }
    }
    });    
}

export function getAutoComplete(tickerName) {
    if (tickerName && coinList.length > 0) {
    let result = coinList.filter(coin => {
        return coin.name.toLowerCase().includes(tickerName.toLowerCase())
    }).slice(0, 4)
        return result
    }else {
        return []
    }
}

export function validate(tickerName, cb) {
    if (validateByCoinList(tickerName)) {
        subscribeToTicker(tickerName, cb)
    } else {
        cb(tickerName, '-', false)
    }
}

function validateByCoinList(tickerName) {
    if (tickerName && coinList.length > 0) {
        let result = false

        if (coinList.find(coin => {
            return coin.symbol.toLowerCase() === tickerName.toLowerCase()
        })) {
            result = true
        } else {
            result = false
        }
        return result
    }
}

window.coinList = coinList


