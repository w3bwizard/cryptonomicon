const API_KEY = '74eea2552d64bb162020979867150f7c48bd83b30c10b95afae842e42ae12384'
const tickersHandlers = new Map()
const socket = new WebSocket(`wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`);


socket.onmessage = function(event) {
    let price = JSON.parse(event.data)
    if (price.TYPE === '5' && price.PRICE != undefined) {
        const handler = tickersHandlers.get(price.FROMSYMBOL)
        handler(price.FROMSYMBOL, price.PRICE)
        let data = [price.FROMSYMBOL, price.PRICE]
        console.log(data)
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


