const API_KEY = '74eea2552d64bb162020979867150f7c48bd83b30c10b95afae842e42ae12384'
const tickersHandlersUSD = new Map()
const tickersHandlersBTC = new Map()
const socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`);

// Если добавить тикер BTC и потом удалить, то удаляется фоновая подписка на BTC для курса обмена

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
    }
    if (message.TYPE === '5' 
        && tickersHandlersBTC.has(message.FROMSYMBOL)
        && message.TOSYMBOL === 'BTC') {
        const handler = tickersHandlersBTC.get(message.FROMSYMBOL)
        handler(message.FROMSYMBOL, message.PRICE)
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

function getCoinNameFromParameter(parameter) {
    if (parameter.indexOf('5~CCCAGG~') != -1) {
        const FROM_INDEX = parameter.indexOf('5~CCCAGG~') + '5~CCCAGG~'.length
        const TO_INDEX = parameter.indexOf('~USD')
        const COIN_NAME = parameter.slice(FROM_INDEX, TO_INDEX)
        
        return COIN_NAME
    } else {
        return null
    }
}

function subscribeToTickerOnWSByBTC(tickerName){
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

window.tickers = tickersHandlersBTC
window.GetCoinName = getCoinNameFromParameter


