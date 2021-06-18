const API_KEY = '74eea2552d64bb162020979867150f7c48bd83b30c10b95afae842e42ae12384'
const tickersHandlers = new Map()
const socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`);


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
        && tickersHandlers.has(message.FROMSYMBOL) 
        && message.TOSYMBOL === 'USD') {
        const handler = tickersHandlers.get(message.FROMSYMBOL)
        handler(message.FROMSYMBOL, message.PRICE)
    }
    if (message.TYPE === '5' 
        && message.FROMSYMBOL === 'BTC') {
        socket.BtcPrice = message.PRICE
    }
    if (message.TYPE === '500' 
        && message.MESSAGE === 'INVALID_SUB') {
        console.log(message.PARAMETER)
        subscribeToTickerOnWSToBTC(getSymbolFromParametr(message.PARAMETER))
    }
    if (message.TYPE === '5' 
        && message.TOSYMBOL === 'BTC') {
        console.log(message.FROMSYMBOL, message.PRICE)
    }
}

function getSymbolFromParametr(parameter) {
    // let re = new RegExp('5~CCCAGG~([\\s\\S]*)~USD')
    // let match = re.exec(parameter)
    // return match[1]
    return parameter.substring(parameter.lastIndexOf('CCCAGG~')+1,parameter.lastIndexOf('~USD'))
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

function subscribeToTickerOnWSToBTC(tickerName){
    sendToWS(
        {
        action: 'SubAdd',
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

export function subscribeToTicker(tickerName, cb) {
    tickersHandlers.set(tickerName, cb)
    subscribeToTickerOnWS(tickerName)
}

export function unsubscribeFromTicker(tickerName) {
    tickersHandlers.delete(tickerName)
    unsubscribeFromTickerOnWS(tickerName)    
}

window.tickers = tickersHandlers


